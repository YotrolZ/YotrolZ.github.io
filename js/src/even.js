!function(l){"use strict";function t(t){this.config=t}t.prototype.setup=function(){var t=this.config.leancloud,e=l.navigator.userAgent.toLowerCase().match(/mobile/i);this.navbar(),this.responsiveTable(),this.config.toc&&(this.scrollToc(),this.tocFollow()),!e&&this.config.fancybox&&this.fancybox(),t.app_id&&t.app_key&&this.recordReadings(),this.config.latex&&this.renderLaTeX(),this.backToTop()},t.prototype.navbar=function(){var t=$("#mobile-navbar"),e=$(".mobile-navbar-icon"),o=new Slideout({panel:document.getElementById("mobile-panel"),menu:document.getElementById("mobile-menu"),padding:180,tolerance:70});o.disableTouch(),e.click(function(){o.toggle()}),o.on("beforeopen",function(){t.addClass("fixed-open"),e.addClass("icon-click").removeClass("icon-out")}),o.on("beforeclose",function(){t.removeClass("fixed-open"),e.addClass("icon-out").removeClass("icon-click")}),$("#mobile-panel").on("touchend",function(){o.isOpen()&&e.click()})},t.prototype.responsiveTable=function(){$(".post-content > table").wrap('<div class="table-responsive">')},t.prototype.scrollToc=function(){var i=$(".post-toc"),c=$(".post-footer");if(i.length){var s=i.offset().top-20;$(l).scroll(function(){var t={start:{position:"absolute",top:s},process:{position:"fixed",top:20}};if($(l).scrollTop()<s)i.css(t.start);else if(i.css(t.process),"none"!=$(".post-toc").css("display")){var e=c.offset().top-i.height()-20,o=document.documentElement.scrollTop+l.innerHeight/2;if(null!=$(".toc-link.active").offset()&&$(".toc-link.active").offset().top>o){var n=$(".post-toc").offset().top-$(".toc-link.active").offset().top;$(".post-toc").offset({top:Math.min(e,o+n)})}e<$(".post-toc").offset().top&&$(".post-toc").offset({top:e})}})}},t.prototype.tocFollow=function(){var s=$(".toc-link"),a=$(".headerlink");$(l).scroll(function(){for(var t=$.map(a,function(t){return $(t).offset().top}),e=$(l).scrollTop(),o=0;o<s.length;o++){var n=o+1===s.length,i=t[o]-30,c=n?1/0:t[o+1]-30;i<e&&e<=c?$(s[o]).addClass("active"):$(s[o]).removeClass("active")}})},t.prototype.fancybox=function(){$.fancybox&&($(".post").each(function(){$(this).find("img").each(function(){var t='href="'+this.src+'"',e='title="'+this.alt+'"';$(this).wrap('<a class="fancybox" '+t+" "+e+"></a>")})}),$(".fancybox").fancybox({openEffect:"elastic",closeEffect:"elastic"}))},t.prototype.recordReadings=function(){if("object"==typeof AV){var n,t,i,e,c,s,a=$(".post-visits"),o=AV.Object.extend("Counter");1===a.length?(i=o,e=new AV.Query("Counter"),c=a.data("url").trim(),s=a.data("title").trim(),e.equalTo("url",c),e.find().then(function(t){if(0<t.length){var e=t[0];e.increment("time",1),e.save(null,{fetchWhenSave:!0}).then(function(t){l(a,t.get("time"))})}else{var o=new i;o.set("title",s),o.set("url",c),o.set("time",1);var n=new AV.ACL;n.setWriteAccess("*",!0),n.setReadAccess("*",!0),o.setACL(n),o.save().then(function(){l(a,o.get("time"))})}},function(t){console.log("Error:"+t.code+" "+t.message)})):(n=o,t=0,a.each(function(){var o=$(this);setTimeout(function(){var t=new AV.Query(n),e=o.data("url").trim();t.equalTo("url",e),t.find().then(function(t){if(0===t.length)l(o,0);else{var e=t[0];l(o,e.get("time"))}},function(t){console.log("Error:"+t.code+" "+t.message)})},100*t++)}))}function l(t,e){var o=t.text().replace(/(\d+)/i,e);t.text(o)}},t.prototype.backToTop=function(){var t=$("#back-to-top");$(l).scroll(function(){100<$(l).scrollTop()?t.fadeIn(1e3):t.fadeOut(1e3)}),t.click(function(){$("body,html").animate({scrollTop:0})})},t.prototype.renderLaTeX=function(){var e=setInterval(function(){if(l.MathJax){var t=l.MathJax;t.Hub.Config({tex2jax:{inlineMath:[["$","$"],["\\(","\\)"]]}}),t.Hub.Queue(["Typeset",t.Hub,$(document.body)[0]]),clearInterval(e)}},500)},new t(l.config).setup()}(window);