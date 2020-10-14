<template>
  <div class="posts p-3">
    <div v-for="post in posts" :key="post.id" class="posts__post">
      <div class="posts__post__header row">
        <div class="posts__post__header__author col-6 font-weight-bold">
          {{ post.username }}
        </div>
        <div class="posts__post__header__date col-6 text-right">
          {{ post.created_at }}
        </div>
      </div>
      <div class="posts__post__text" v-html="post.cooked"></div>
    </div>
  </div>
</template>

<script>
import filter from 'lodash/filter'
import axios from 'axios'
import {JSEncrypt} from 'jsencrypt'

export default {
  name: 'Posts',
  data () {
    return {
      posts: []
    }
  },
  async mounted () {
    const discourseHost = 'http://localhost:3000/'
    const re = new RegExp(/payload=(.*)#/)
    const payload = window.location.href.match(re)

    let keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 1024,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: {name: "SHA-256"}
        },
        true,
        ["encrypt", "decrypt"]
    )
    let exportedPublicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey)
    let exportedPrivateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey)
    const pemPublicKey = this.toPem(exportedPublicKey)
    if (payload) {
      const urlDecodedPayload = decodeURIComponent(payload[1])
      const decrypt = new JSEncrypt()
      decrypt.setPrivateKey(this.toPem(exportedPrivateKey))
      const decryptedPayload = decrypt.decrypt(urlDecodedPayload)
      const userApiKey = JSON.parse(decryptedPayload).key
      try {
        const response = await axios.get(`${discourseHost}site.json`, { headers: { 'User-Api-Key': userApiKey } })
        const currentDsProject = this.$store.state.search.index.replace(/-/g, '_')

        let ihubProjects = response.data.groups

        let projectExists = filter(ihubProjects, function(p) {
          return p.name === currentDsProject
        })

        let createProject
        if (projectExists.length === 0) {
          const data = new FormData()
          data.append("group[name]", currentDsProject)
          data.append("group[visibility_level]", "1")

          createProject = await axios.post(`${discourseHost}admin/groups`, data, {
            headers: {
              'User-Api-Key': userApiKey,
              'Content-Type': 'multipart/form-data;'
            }
          })
        }

        if (projectExists.length === 1 || (createProject.status === 200)) {
          let categoriesList = await axios.get(`${discourseHost}categories.json`, {
            headers: {
              'User-Api-Key': userApiKey
            }
          })

          categoriesList = categoriesList.data.category_list.categories

          // filter for one with specific name + project permissions
          let categoryExists = filter(categoriesList, function(o) {
            return ((o.name === `Datashare Documents for ${currentDsProject}`) && (o.icij_projects_for_category[0] === currentDsProject))
          })

          let createCategory
          if (categoryExists.length === 0) {
            const data = new FormData()
            data.append("name", "Datashare Documents")
            data.append(`permissions[${currentDsProject}]`, "1")
            data.append("color", "BF1E2E")
            data.append("text_color", "FFFFFF")
            data.append("allow_badges", "true")
            data.append("required_tag_group_name", "")
            data.append("topic_featured_link_allowed", "true")
            data.append("search_priority", "0")

            // if it does not exist, create it
            createCategory = await axios.post(`${discourseHost}categories.json`, data, {
              headers: {
                'User-Api-Key': userApiKey,
                'Content-Type': 'x-www-form-urlencoded;'
              }
            })
          }

          if (categoryExists.length === 1 || createCategory.status === 200) {
            // get Datashare Documents category id
            let categories = await axios.get(`${discourseHost}categories.json`, {
              headers: {
                'User-Api-Key': userApiKey
              }
            })

            categories = categories.data.category_list.categories

            let category = filter(categories, function(o) {
              return ((o.name === "Datashare Documents") && (o.icij_projects_for_category[0] === currentDsProject))
            })

            category = category[0].id

            let topics = await axios.get(`${discourseHost}c/${category}.json`, {
              headers: {
                'User-Api-Key': userApiKey
              }
            })

            topics = topics.data.topic_list.topics

            const documentId =  this.$store.state.document.idAndRouting.id

            let topicExists = filter(topics, function(o) {
              return o.datashare_document_id === documentId
            })

            let createTopic
            if (topicExists.length === 0) {
              const data = new FormData()
              data.append("raw", "trying to add a new topic from dataconnect")
              data.append("title", `Datashare document ${documentId.substring(0,7)}`)
              data.append("category", category.toString())
              data.append("archetype", "regular")
              data.append("datashare_document_id", documentId)

              createTopic = await axios.post(`${discourseHost}posts.json`, data, {
                headers: {
                  'User-Api-Key': userApiKey,
                  'Content-Type': 'x-www-form-urlencoded;'
                }
              })
            }

            if (topicExists.length === 1 || createTopic.status === 200) {

              let topicId
              if (createTopic) {
                topicId = createTopic.data.topic_id
              } else {
                topicId = topicExists[0].id
              }

              let setPosts = await axios.get(`${discourseHost}t/${topicId}/posts.json`, { headers: { 'User-Api-Key': userApiKey } })
              this.$set(this, 'posts', setPosts.data.post_stream.posts)

            }
          }
        }

      } catch (error) {
        console.log(error)
      }
    } else {
      const discourseUrl = `${discourseHost}user-api-key/new`
      const clientId = encodeURIComponent('moleary')
      const authRedirect = encodeURIComponent([window.location.protocol, '//', window.location.host, '/#', this.$router.currentRoute.fullPath].join(''))
      const publicKey = encodeURIComponent(pemPublicKey)
      window.location.href = `${discourseUrl}?application_name=dataconnect&client_id=${clientId}&scopes=read,write&nonce=bar&auth_redirect=${authRedirect}&public_key=${publicKey}`
    }
  },
  methods: {
    arrayBufferToBase64(arrayBuffer) {
      let byteArray = new Uint8Array(arrayBuffer)
      let byteString = ''
      for(let i=0; i < byteArray.byteLength; i++) {
          byteString += String.fromCharCode(byteArray[i])
      }
      return window.btoa(byteString)
    },
    toPem(key) {
      let b64 = this.arrayBufferToBase64(key)
      return "-----BEGIN PUBLIC KEY-----\n" + b64 + "\n-----END PUBLIC KEY-----"
    }
  }

}
</script>

<!-- this.$set(this, 'posts', response.data.post_stream.posts) -->
