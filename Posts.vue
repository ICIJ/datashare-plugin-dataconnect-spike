<template>
  <div class="posts p-3">
    <div class="posts__actions">
      <div class="posts__actions__form-group">
        <textarea class="posts__actions__form-group-textarea form-control rounded-0" v-model="comment"
                  placeholder="new comment"></textarea>
        <button class="posts__actions__form-group__create btn btn-primary" @click="createComment()">Create</button>
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
  data() {
    return {
      posts: [],
      comment: "",
      axiosConfig: null,
      discourseHost: 'http://localhost:3000/'
    }
  },
  async mounted() {
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
      const userApiKey = JSON.parse(decryptedPayload).key
      this.$set(this, "axiosConfig", {headers: {'User-Api-Key': userApiKey}});

      const documentId = this.$store.state.document.idAndRouting.id
      let topicResponse = await axios.get(`${this.discourseHost}custom-fields-api/topics/${documentId}.json`, this.axiosConfig)
      if (topicResponse.status !== 404) {
        this.$set(this, 'posts', topicResponse.data.topic_view_posts.post_stream.posts)
      }
    } else {
      const discourseUrl = `${this.discourseHost}user-api-key/new`
      const clientId = encodeURIComponent('bthomas')
      const authRedirect = encodeURIComponent([window.location.protocol, '//', window.location.host, '/#', this.$router.currentRoute.fullPath].join(''))
      const publicKey = encodeURIComponent(pemPublicKey)
      window.location.href = `${discourseUrl}?application_name=dataconnect&client_id=${clientId}&scopes=read,write&nonce=bar&auth_redirect=${authRedirect}&public_key=${publicKey}`
    }
  },
  methods: {
    async createComment() {
      const documentId = this.$store.state.document.idAndRouting.id
      let topicResponse
      try {
        topicResponse = await axios.get(`${this.discourseHost}custom-fields-api/topics/${documentId}.json`, this.axiosConfig)
      } catch (err) {
        topicResponse = err.response
      }
      if (topicResponse.status === 404) {
        let category = await this.getOrCreateCategory()
        if (category != null) {
          let topic = {
            raw: this.comment,
            title: `Datashare document ${documentId.substring(0, 7)}`,
            category: category.id.toString(),
            archetype: "regular",
            datashare_document_id: documentId
          }
          await axios.post(`${this.discourseHost}posts.json`, topic, this.axiosConfig)
        }
      } else if (topicResponse.status === 200) {
        await axios.post(`${this.discourseHost}posts.json`, {raw: this.comment, topic_id: topicResponse.data.topic_id}, this.axiosConfig)
      }
    },
    async getOrCreateCategory() {
      let category = await this.getCategory()
      const currentDsProject = this.$store.state.search.index.replace(/-/g, '_')
      if (category === null) {
        let permissions = {}
        permissions[currentDsProject] = "1"
        let data = {
          name: `Datashare Documents for ${currentDsProject}`,
          color: "BF1E2E",
          text_color: "FFFFFF",
          permissions: permissions
        }
        const axiosResponse = await axios.post(`${this.discourseHost}categories.json`, data, this.axiosConfig);
        return axiosResponse.data
      } else {
        return category
      }
    },
    async getCategory() {
      const currentDsProject = this.$store.state.search.index.replace(/-/g, '_')
      let categories = await axios.get(`${this.discourseHost}categories.json`, this.axiosConfig)

      categories = categories.data.category_list.categories

      let filtered = filter(categories, function (o) {
        return ((o.name === `Datashare Documents for ${currentDsProject}`) && (o.icij_projects_for_category[0] === currentDsProject))
      })
      return filtered.length > 0 ? filtered[0]: null
    },
    addNewLines(str) {
      let finalString = '';
      while (str.length > 0) {
        finalString += str.substring(0, 64) + '\n';
        str = str.substring(64);
      }
      return finalString;
    },
    arrayBufferToBase64(arrayBuffer) {
      let byteArray = new Uint8Array(arrayBuffer)
      let byteString = ''
      for (let i = 0; i < byteArray.byteLength; i++) {
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
