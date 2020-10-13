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
import { JSEncrypt } from 'jsencrypt'
import cryptico from 'cryptico'

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
    // const key = "-----BEGIN RSA PRIVATE KEY-----\n" +
    //     "MIIEowIBAAKCAQEA4Uf9iQqFcLv7wLL1fYar7copOalXIcjAksmfH2/1j+a1ewCk\n" +
    //     "WEK/yjtwUtmL3dFg0l/GAAZRz8kYekc+BDoNsKBw52e9wIbHeQPgnlYjsk655amF\n" +
    //     "Z5eQWWF7j2EnrfwssiF8o0lp82/DYY+pqTz61zamgXB7oLh/81V0Og94C7Bcdi4N\n" +
    //     "sqlR6PYktVaV5/Fu/4gJWWbz6/b1Q7Pek3G8F/EAXBGFZHjtKMvW74XqeriQtSpK\n" +
    //     "6k08340AIwprfSioK/6fd1oSjT4IAA1V/g+hl6ZR+zofWlw2xIfAGxCf0VXik01R\n" +
    //     "1DQ7BU6fe6hRf2h9l9NiOfPY0FWlyH9QlY2SDwIDAQABAoIBAEvnFoxSyCz4mVUO\n" +
    //     "ttnJQypGH+e2n43ZdtC+L+fGsCUA5YqA59549ueraSfw9kgRYJ7g9/RQLMZmieHB\n" +
    //     "GSsRaEVneULuWCeDAbhLTyXp/fL4xXeUy0bg8Ri8WIYxhM4BFgoacEUP2ivULy8y\n" +
    //     "2UYVLqrOVgFspaq8HxgcZaGeTqMY8edXiycuB5eI5bk/Xut/Vn5e1pVcSYMxXm86\n" +
    //     "FG4JW76tghelYZrTuyC2NvnT7a4G0XxeSoOku3vg3J94R1Q6N2NNMVBKUY5ci5kS\n" +
    //     "ghxuHMJS/0Zt3vgSHj5hty0ozt5WN3Nzuz+5iWaBp5bMAGR+of8atoNmZa5nKinr\n" +
    //     "+enAIWECgYEA8yFX21KWTDm5PH4Moj5pGFxcVYBNmrGTUcl+o7gvacoChlAh9aVu\n" +
    //     "BiDzExc0BMVCC8RQx/csQzlWZFx6sWmqXopUSu33ia8hegeNwYhgMtzaiPSJN7B0\n" +
    //     "eKniHgY4d2dgzw9v4kCidZkuu4//niQ5o5fVcUpcoIQzldogfZaB2lECgYEA7TTG\n" +
    //     "ZoPogsYVWLI3LgDOicrFV60OXu02I0GINbgZD+gxsB4k2tAaxlTTJU0L0bjL0dPy\n" +
    //     "/uvzEBB6GeBP5+9TiNt/3fZnjnWgzds2JLh2V9O8oxBBDl0zUXE9m7Hbk+K3UbUZ\n" +
    //     "6XSa7cGap5fpN5xxi1cEeQtbzSakETGfq2gzLl8CgYANVUTGKE9Jutinspnqw9Vr\n" +
    //     "mpUNs02OMDLOB2jEfbNL7+IXj4ltOTdBaskpwNn/cPngP1HWxX1N6nUMZ+3qkMrh\n" +
    //     "CGD7AvXSPSJu2L8zX9E2uNnbLN3hifG5NEfMMbcjBS5P7J7MH5NJM69WZd00xPPM\n" +
    //     "PuVboyJVQyq5Cw9BE+HnIQKBgQC4cw5HzxCxB/i3ZLVVt1jjeuJjX/VJyWkMlzuk\n" +
    //     "kggi/2oLyhTcdXAsgu9BFR04slsDSa2tnqn99uILVwqrjsVFKXHPlnhGJZ+qE2iR\n" +
    //     "u0KC3unTXqNH2R87mDPQ6seUwnnMNmf0yjBi6uYopg66qJL+R+b5fOSgrQhtOkov\n" +
    //     "jjImPwKBgHyVCw8k757IVZXc5XMY75PFNtzjppgfvspg7hWR67QM/LbSiwDRzYx3\n" +
    //     "cal2LTjq2uPSStjlyaO8JHzBFVT8gUhOHPzgw7a/sHZ/qrP8kfrh68sypEOVe1+H\n" +
    //     "WNIoGrntoUmx7dHDf19nNcA1NSBZsW9mmn272JeZtg1Ux1pLgKHw\n" +
    //     "-----END RSA PRIVATE KEY-----\n"
    const rsa = cryptico.generateRSAKey('', 1024)
    const key = `-----BEGIN PUBLIC KEY-----\n${cryptico.publicKeyString(rsa)}\n-----END PUBLIC KEY-----`
    if (payload) {
      const urlDecodedPayload = decodeURIComponent(payload[1])
      const decrypt = new JSEncrypt()
      decrypt.setPrivateKey(key)
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
      const publicKey = encodeURIComponent(key)
      window.location.href = `${discourseUrl}?application_name=dataconnect&client_id=${clientId}&scopes=read,write&nonce=bar&auth_redirect=${authRedirect}&public_key=${publicKey}`
    }
  }
}
</script>

<!-- this.$set(this, 'posts', response.data.post_stream.posts) -->
