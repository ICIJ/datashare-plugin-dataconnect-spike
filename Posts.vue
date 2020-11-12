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
        <div class="posts__post__header__delete p-2 col-2">
          <fa icon="trash-alt" @click="deletePost(post.id)"></fa>
        </div>
        <div class="posts__post__header__author col-5 font-weight-bold">
          {{ post.username }}
        </div>
        <div class="posts__post__header__date col-5 text-right">
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

export default {
  name: 'Posts',
  data() {
    return {
      posts: [],
      comment: "",
      axiosConfig: null,
      discourseHost: 'http://localhost:8888/api/proxy'
    }
  },
  async mounted() {
    const documentId = this.$store.state.document.idAndRouting.id
    const project = this.$store.state.search.index
    let topicResponse = await axios.get(`${this.discourseHost}/${project}/custom-fields-api/topics/${documentId}.json`, this.axiosConfig)
    if (topicResponse.status !== 404) {
      this.$set(this, 'posts', topicResponse.data.topic_view_posts.post_stream.posts)
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
        await axios.post(`${this.discourseHost}posts.json`, {raw: this.comment, topic_id: topicResponse.data.topic_view_posts.id}, this.axiosConfig)
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
    },
    deletePost (postId) {
      axios.delete(`${this.discourseHost}posts/${postId}.json`, this.axiosConfig)
    }
  }
}
</script>
