const getTextFunc = lang => {
  const data = lang === 'en' ? _en : _zh
  return field => data[field] || _zh[field]
}

const switchLanguage = lang => {
  _lang = lang
  const getText = getTextFunc(lang)

  // head
  $('title').text(getText('title'))
  $('[property="og:title"]').text(getText('title'))
  
  // nav
  $('.header-title').text(getText('title'))
  const tooltip = ['navMenu', 'navReset', 'navReadme', 'navDashboard', 'navHome']
  $('.tooltip-text').each(function(index) {
    $(this).text(getText(tooltip[index]))
  })
  
  // aside
  const menuTitle = ['menuLoad', 'menuManage', 'menuMeta', 'menuAlign', 'menuTitle', 'menuSearch']
  $('.control-item-title').each(function(index) {
    $(this).text(getText(menuTitle[index]))
  })
  $('#load-from-local').text(getText('menuLoadLocal'))
  $('#load-from-docusky').text(getText('menuLoadDocusky'))
  $('#search-btn span').text(getText('menuSearchBtn'))
  $('#search-reset span').text(getText('menuSearchReset'))

  // login modal
  $('#login-label').text(getText('loginWelcome'))
  $('[for="username"]').text(getText('loginUsername'))
  $('[for="password"]').text(getText('loginPassword'))
  $('#opendb-btn').text(getText('loginPublicDB'))
  $('#login-btn').text(getText('loginBtn'))

  // corpus list
  const tableHeader = ['tableDB', 'tableCorpus', 'tableStatus', 'tableCheck']
  $('#my-corpus-list th').each(function(index) {
    if (index > 0) {
      $(this).text(getText(tableHeader[index - 1]))
    }
  })
  $('#load-from-docusky-btn').text(getText('corpusLoadBtn'))

  // explain
  $('#explain-label').text(getText('readmeTitle'))

  //search
  $(`[key="${_zh.searchCount}"] .meta-name`).text(getText('searchCount'))
  $(`[key="${_en.searchCount}"] .meta-name`).text(getText('searchCount'))
  $(`[key="${_zh.searchParagraphCount}"] .meta-name`).text(getText('searchParagraphCount'))
  $(`[key="${_en.searchParagraphCount}"] .meta-name`).text(getText('searchParagraphCount'))
}