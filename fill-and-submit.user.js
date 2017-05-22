// ==UserScript==
// @name         FFI_InputFillnSubmit
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  generic automatic input fill and submit
// @downloadURL  
// @author       Ralf Anders
// @match        *://*/*
// @exclude      *://*.google.*/*
// @grant        none
// ==/UserScript==


function getUrlParameter(par) {

  var value='';
  var UrlParameter = window.location.search;

  if(UrlParameter !== "") {
    var i = UrlParameter.indexOf(par+"=");
    if(i >= 0) {
      i = i+par.length+1;
      var k = UrlParameter.indexOf("&", i);
      if(k < 0) {
        k = UrlParameter.length;
      }
      value = UrlParameter.substring(i, k);
      for(i=0; i<value.length; i++) {
        if(value.charAt(i) == '+') {
          value=value.substring(0, i)+" "+value.substring(i+1,value.length);
        }
      }
      value=unescape(value);
    } else return 0;
  }
  return value;
}

// Skript nur arbeiten lassen, wenn ffi=true
if (getUrlParameter("ffi") == "1:1") {
  var query = getUrlParameter("q");
  var submitBy = getUrlParameter("subby");
  var submitId = getUrlParameter("subid");
  var submitNr = getUrlParameter("subnr"); // default: 0
  var inputBy = getUrlParameter("inpby");
  var inputId = getUrlParameter("inpid");
  var inputNr = getUrlParameter("inpnr"); // default: 0

  // fill Input, if id-identifier
  if (inputBy == "id")
   {
     var queryFeld = document.getElementById(inputId);
     queryFeld.value = query;
   }

  // fill Input, if name-identifier
  if (inputBy == "name")
   {
     var queryFeld = document.getElementsByName(inputId)[inputNr];
     queryFeld.value = query;
   }

  // fill Input, if tagname-identifier
  if (inputBy == "tag")
  {
    var queryFeld = document.getElementsByTagName(inputId)[inputNr];
    queryFeld.value = query;
  }
      
  // submit-click, if id-identifier
  if (submitBy == "id") document.getElementById(submitId).click();

  // submit-click, if name-identifier
  if (submitBy == "name") document.getElementsByName(submitId)[submitNr].click();

  // submit-click, if tagname-identifier    
  if (submitBy == "tag") document.getElementsByTagName(submitId)[submitNr].click();

} 

// https://patentscope.wipo.int/search/en/search.jsf?inpby=id&inpid=simpleSearchSearchForm:fpSearch&subby=id&subid=simpleSearchSearchForm:commandSimpleFPSearch&ffi=1:1&q=Liebherr
// https://www.bundesanzeiger.de/ebanzwww/wexsservlet?inpby=id&inpid=genericsearch_param.fulltext&subby=tag&subid=input&subnr=3&ffi=1:1&q=Schott


/*var queryFeld = document.getElementById("simpleSearchSearchForm:fpSearch");
queryFeld.value = query;
document.getElementById("simpleSearchSearchForm:commandSimpleFPSearch").click();*/
