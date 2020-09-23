import Comments from './Comments'

document.addEventListener('datashare:ready', async ({ detail }) => {
  detail.core.registerHook({
    target: 'document.content:after',
    definition: Comments
  })
}, false)
