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
  import axios from 'axios'

  export default {
    name: 'Posts',
    data () {
      return {
        posts: []
      }
    },
    async mounted () {
      const url = new URL('/discourse/t/11/posts.json', `${window.location.protocol}//${window.location.host}`)
      axios.get(url.href)
        .then(response => {
          this.$set(this, 'posts', response.data.post_stream.posts)
        })
        .catch(_ => console.log('error'))
    }
  }
</script>

