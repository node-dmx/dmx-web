$("#main-content-tabs .tab-pane").hide()

$("#main-navbar .nav-link").click(function(e) {
  $("#main-content-tabs .tab-pane").hide()
  $($(this).attr("href")).show()
})

if(!window.location.hash) window.location.hash = "control"

$(".nav-link[href='" + window.location.hash + "']").click()