<template>
  <div class="posts p-3">
    <div class="posts__actions">
        <div class="posts__actions__form-group">
          <textarea class="posts__actions__form-group-textarea form-control rounded-0" v-model="comment" placeholder="new comment"></textarea>
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
  import axios from 'axios'

  export default {
    name: 'Posts',
    data () {
      return {
        posts: [],
        comment: ""
      }
    },
    async mounted () {
      let pathFragments = window.location.hash.split("/"); // #/d/index/docid/routing
      let index = pathFragments[2]
      let docId = pathFragments[3]
      const url = new URL(`/comments/${index}/${docId}/all`, `${window.location.protocol}//${window.location.host}`)
      try {
        const resp = await axios.get(url.href)
        this.$set(this, 'posts', resp.data.topic_view_posts.post_stream.posts)
      } catch (e ) {
        console.log('error', e)
      }
    },
    methods: {
      async createComment () {
        let pathFragments = window.location.hash.split("/"); // #/d/index/docid/routing
        let index = pathFragments[2]
        let docId = pathFragments[3]
        try {
          await axios.put(
              new URL(`/comments/${index}/${docId}`, `${window.location.protocol}//${window.location.host}`).href,
              {"title": "Datashare document number " + docId.substring(0, 6), "raw": this.comment})
        } catch (e )  {
          console.log('error', e)
        }
      }
    }
  }
</script>

