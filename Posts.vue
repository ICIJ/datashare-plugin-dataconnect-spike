<template>
  <div class="posts p-3">
    <div class="posts__actions">
      <div class="posts__actions__form-group">
        <textarea class="posts__actions__form-group-textarea form-control rounded-0" v-model="comment" placeholder="new comment"></textarea>
        <button class="posts__actions__form-group__create btn btn-primary mt-3 mb-3" @click="createComment()">Create</button>
      </div>
    </div>
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
      posts: [],
      comment: "",
      topic: "",
      category: "",
      userApiKey: "",
      documentId: "",
      discourseHost: 'http://localhost:3000/'
    }
  },
  async mounted () {
    const re = new RegExp(/payload=(.*)#/)
    const payload = window.location.href.match(re)

    let pemPrivateKey = window.localStorage.getItem("RSAPrivateKey")
    let pemPublicKey = window.localStorage.getItem("RSAPublicKey")
    if (pemPrivateKey === null || pemPublicKey === null) {
      const keyPair = await window.crypto.subtle.generateKey(
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
      let privateKeyBody = this.addNewLines(this.arrayBufferToBase64(exportedPrivateKey));
      pemPrivateKey = `-----BEGIN PRIVATE KEY-----\n${privateKeyBody}-----END PRIVATE KEY-----`
      pemPublicKey = this.toPem(exportedPublicKey)
      window.localStorage.setItem("RSAPrivateKey", pemPrivateKey)
      window.localStorage.setItem("RSAPublicKey", pemPublicKey)
    }

    if (payload) {
      const urlDecodedPayload = decodeURIComponent(payload[1])
      const decrypt = new JSEncrypt()
      decrypt.setPrivateKey(pemPrivateKey)
      const decryptedPayload = decrypt.decrypt(urlDecodedPayload)

      this.$set(this, 'userApiKey', JSON.parse(decryptedPayload).key)
      this.$set(this, 'documentId', this.$store.state.document.idAndRouting.id)
      try {
        const response = await axios.get(`${this.discourseHost}site.json`, { headers: { 'User-Api-Key': this.userApiKey } })
        const currentDsProject = this.$store.state.search.index.replace(/-/g, '_')

        let projectExists = filter(response.data.groups, p => p.name === currentDsProject)

        let createProject
        if (projectExists.length === 0) {
          const data = new FormData()
          data.append("group[name]", currentDsProject)
          data.append("group[visibility_level]", "1")

          createProject = await axios.post(`${this.discourseHost}admin/groups`, data, {
            headers: {
              'User-Api-Key': this.userApiKey,
              'Content-Type': 'multipart/form-data;'
            }
          })
        }

        if (projectExists.length === 1 || (createProject.status === 200)) {
          let categoriesList = await axios.get(`${this.discourseHost}categories.json`, {
            headers: {
              'User-Api-Key': this.userApiKey
            }
          })

          categoriesList = categoriesList.data.category_list.categories

          // filter for one with specific name + project permissions
          let categoryExists = filter(categoriesList, c => (c.name === `Datashare Documents for ${currentDsProject}`) && (c.icij_projects_for_category[0] === currentDsProject))

          let createCategory
          if (categoryExists.length === 0) {
            const data = new FormData()
            data.append("name", `Datashare Documents for ${currentDsProject}`)
            data.append(`permissions[${currentDsProject}]`, "1")
            data.append("color", "BF1E2E")
            data.append("text_color", "FFFFFF")

            // if it does not exist, create it
            createCategory = await axios.post(`${this.discourseHost}categories.json`, data, {
              headers: {
                'User-Api-Key': this.userApiKey,
                'Content-Type': 'x-www-form-urlencoded;'
              }
            })
          }

          if (categoryExists.length === 1 || createCategory.status === 200) {
            // get Datashare Documents category id
            let categories = await axios.get(`${this.discourseHost}categories.json`, {
              headers: {
                'User-Api-Key': this.userApiKey
              }
            })

            let category = filter(categories.data.category_list.categories, c => (c.name === `Datashare Documents for ${currentDsProject}`) && (c.icij_projects_for_category[0] === currentDsProject))
            this.$set(this, 'category', category[0].id)

            let topics = await axios.get(`${this.discourseHost}c/${this.category}.json`, {
              headers: {
                'User-Api-Key': this.userApiKey
              }
            })

            let topicExists = filter(topics.data.topic_list.topics, t => t.datashare_document_id === this.documentId)

            let createTopic
            if (topicExists.length === 0) {
              const data = new FormData()
              data.append("raw", "This is the start of the thread pertaining to this document.")
              data.append("title", `Datashare document ${this.documentId.substring(0,7)}`)
              data.append("category", this.category.toString())
              data.append("archetype", "regular")
              data.append("datashare_document_id", this.documentId)

              createTopic = await axios.post(`${this.discourseHost}posts.json`, data, {
                headers: {
                  'User-Api-Key': this.userApiKey,
                  'Content-Type': 'x-www-form-urlencoded;'
                }
              })
            }

            if (topicExists.length === 1 || createTopic.status === 200) {

              if (createTopic) {
                this.$set(this, 'topic', createTopic.data.topic_id)
              } else {
                this.$set(this, 'topic', topicExists[0].id)
              }

              let setPosts = await axios.get(`${this.discourseHost}t/${this.topic}/posts.json`, { headers: { 'User-Api-Key': this.userApiKey } })
              if (setPosts.status === 200) {
                this.$set(this, 'posts', setPosts.data.post_stream.posts)
              }

            }
          }
        }

      } catch (error) {
        console.log(error)
      }
    } else {
      const discourseUrl = `${this.discourseHost}user-api-key/new`
      const clientId = encodeURIComponent('moleary')
      const authRedirect = encodeURIComponent([window.location.protocol, '//', window.location.host, '/#', this.$router.currentRoute.fullPath].join(''))
      const publicKey = encodeURIComponent(pemPublicKey)
      window.location.href = `${discourseUrl}?application_name=dataconnect&client_id=${clientId}&scopes=read,write&nonce=bar&auth_redirect=${authRedirect}&public_key=${publicKey}`
    }
  },
  methods: {
    async createComment () {
      const data = new FormData()
      data.append("raw", this.comment)
      data.append("topic_id", this.topic.toString())
      data.append("archetype", "regular")
      data.append("datashare_document_id", this.documentId)

      let createPost = await axios.post(`${this.discourseHost}posts.json`, data, {
        headers: {
          'User-Api-Key': this.userApiKey,
          'Content-Type': 'x-www-form-urlencoded;'
        }
      })

      if (createPost.status == 200) {
        let setPosts = await axios.get(`${this.discourseHost}t/${this.topic}/posts.json`, { headers: { 'User-Api-Key': this.userApiKey } })
        this.$set(this, 'posts', setPosts.data.post_stream.posts)
        this.$set(this, 'comment', null)
      }
    },
    addNewLines(str) {
        let finalString = '';
        while(str.length > 0) {
            finalString += str.substring(0, 64) + '\n';
            str = str.substring(64);
        }
        return finalString;
    },
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
