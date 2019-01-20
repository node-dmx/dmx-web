$("#main-content-tabs .tab-pane").hide()

$("#main-navbar .nav-link").click(function(e) {
  $("#main-content-tabs .tab-pane").hide()
  $($(this).attr("href")).show()
})

$(".nav-link[href='" + window.location.hash + "']").click()