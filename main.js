import Posts from './Posts'

document.addEventListener('datashare:ready', async ({ detail }) => {
  detail.core.registerHook({
    target: 'document.content:after',
    definition: Posts
  })
}, false)
