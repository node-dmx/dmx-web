defaultPage = "control"

$("#main-content-tabs .tab-pane").hide()

$("#main-navbar .nav-link").click(function(e) {
  $("#main-content-tabs .tab-pane").hide()
  $($(this).attr("href")).show()

  return false
})

/**
 * Set page to default page if no hash is set
 */
if (!window.location.hash) window.location.hash = defaultPage

/**
 * Set page to default page if invalid hash is set
 */
if ($(`.tab-pane${window.location.hash}`).length === 0) {
  window.location.hash = defaultPage
}

$(".nav-link[href='" + window.location.hash + "']").click()