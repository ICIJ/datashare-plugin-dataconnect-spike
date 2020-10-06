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
export default {
  name: 'Posts',
  data() {
    return {
      posts: []
    }
  },
  async mounted() {
    const key = "-----BEGIN RSA PRIVATE KEY-----\n" +
        "MIIEowIBAAKCAQEA4Uf9iQqFcLv7wLL1fYar7copOalXIcjAksmfH2/1j+a1ewCk\n" +
        "WEK/yjtwUtmL3dFg0l/GAAZRz8kYekc+BDoNsKBw52e9wIbHeQPgnlYjsk655amF\n" +
        "Z5eQWWF7j2EnrfwssiF8o0lp82/DYY+pqTz61zamgXB7oLh/81V0Og94C7Bcdi4N\n" +
        "sqlR6PYktVaV5/Fu/4gJWWbz6/b1Q7Pek3G8F/EAXBGFZHjtKMvW74XqeriQtSpK\n" +
        "6k08340AIwprfSioK/6fd1oSjT4IAA1V/g+hl6ZR+zofWlw2xIfAGxCf0VXik01R\n" +
        "1DQ7BU6fe6hRf2h9l9NiOfPY0FWlyH9QlY2SDwIDAQABAoIBAEvnFoxSyCz4mVUO\n" +
        "ttnJQypGH+e2n43ZdtC+L+fGsCUA5YqA59549ueraSfw9kgRYJ7g9/RQLMZmieHB\n" +
        "GSsRaEVneULuWCeDAbhLTyXp/fL4xXeUy0bg8Ri8WIYxhM4BFgoacEUP2ivULy8y\n" +
        "2UYVLqrOVgFspaq8HxgcZaGeTqMY8edXiycuB5eI5bk/Xut/Vn5e1pVcSYMxXm86\n" +
        "FG4JW76tghelYZrTuyC2NvnT7a4G0XxeSoOku3vg3J94R1Q6N2NNMVBKUY5ci5kS\n" +
        "ghxuHMJS/0Zt3vgSHj5hty0ozt5WN3Nzuz+5iWaBp5bMAGR+of8atoNmZa5nKinr\n" +
        "+enAIWECgYEA8yFX21KWTDm5PH4Moj5pGFxcVYBNmrGTUcl+o7gvacoChlAh9aVu\n" +
        "BiDzExc0BMVCC8RQx/csQzlWZFx6sWmqXopUSu33ia8hegeNwYhgMtzaiPSJN7B0\n" +
        "eKniHgY4d2dgzw9v4kCidZkuu4//niQ5o5fVcUpcoIQzldogfZaB2lECgYEA7TTG\n" +
        "ZoPogsYVWLI3LgDOicrFV60OXu02I0GINbgZD+gxsB4k2tAaxlTTJU0L0bjL0dPy\n" +
        "/uvzEBB6GeBP5+9TiNt/3fZnjnWgzds2JLh2V9O8oxBBDl0zUXE9m7Hbk+K3UbUZ\n" +
        "6XSa7cGap5fpN5xxi1cEeQtbzSakETGfq2gzLl8CgYANVUTGKE9Jutinspnqw9Vr\n" +
        "mpUNs02OMDLOB2jEfbNL7+IXj4ltOTdBaskpwNn/cPngP1HWxX1N6nUMZ+3qkMrh\n" +
        "CGD7AvXSPSJu2L8zX9E2uNnbLN3hifG5NEfMMbcjBS5P7J7MH5NJM69WZd00xPPM\n" +
        "PuVboyJVQyq5Cw9BE+HnIQKBgQC4cw5HzxCxB/i3ZLVVt1jjeuJjX/VJyWkMlzuk\n" +
        "kggi/2oLyhTcdXAsgu9BFR04slsDSa2tnqn99uILVwqrjsVFKXHPlnhGJZ+qE2iR\n" +
        "u0KC3unTXqNH2R87mDPQ6seUwnnMNmf0yjBi6uYopg66qJL+R+b5fOSgrQhtOkov\n" +
        "jjImPwKBgHyVCw8k757IVZXc5XMY75PFNtzjppgfvspg7hWR67QM/LbSiwDRzYx3\n" +
        "cal2LTjq2uPSStjlyaO8JHzBFVT8gUhOHPzgw7a/sHZ/qrP8kfrh68sypEOVe1+H\n" +
        "WNIoGrntoUmx7dHDf19nNcA1NSBZsW9mmn272JeZtg1Ux1pLgKHw\n" +
        "-----END RSA PRIVATE KEY-----\n"
    const publicKey = encodeURIComponent(key)
    const authRedirect = encodeURIComponent('http://localhost:8888/')
    const discourseUrl = 'http://localhost:3000/user-api-key/new'
    const clientId = encodeURIComponent('alhote')
    const url = `${discourseUrl}?application_name=dataconnect&client_id=${clientId}&scopes=write&nonce=bar&auth_redirect=${authRedirect}&public_key=${publicKey}`
    window.location.href = url
  }
}
</script>

