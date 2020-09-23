import Posts from './Posts'

document.addEventListener('datashare:ready', async ({ detail: { core } }) => {
    // We register a post-pipeline function for the `document-view-tabs` category
    core.registerPipeline({
      name: 'document-view-tabs-test',
      category: 'document-view-tabs:post',
      // The function that is applied to the tabs list
      type (tabs, document) {
        tabs.push({
          name: 'comments-tab',
          label: 'Comments',
          icon: 'align-left',
          props: { document },
          component: Posts
        })
        return tabs
      }
    })
  }, true)
