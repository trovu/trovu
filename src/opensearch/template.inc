<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription
  xmlns="http://a9.com/-/spec/opensearch/1.1/"
  xmlns:moz="http://www.mozilla.org/2006/browser/search/"
>
  <ShortName><?PHP echo $title ?></ShortName>
  <Url
    type="text/html"
    method="get"
    template="<?PHP echo $urlTrovu ?>process/?#query={searchTerms}&amp;<?PHP echo $paramStr ?>"
  />

  <image width="16" height="16"><?PHP echo $urlTrovu ?>favicon.ico</image>

  <Contact>opensearch@trovu.net</Contact>

  <moz:UpdateUrl
    ><?PHP echo $urlOpensearch ?>?<?PHP echo $paramStr ?></moz:UpdateUrl
  >
  <moz:SearchForm
    ><?PHP echo $urlTrovu ?>#<?PHP echo $paramStr ?></moz:SearchForm
  >
  <moz:IconUpdateUrl><?PHP echo $urlTrovu ?>favicon.ico</moz:IconUpdateUrl>
  <moz:UpdateInterval>7</moz:UpdateInterval>

  <Query role="example" searchTerms="g berlin" />
  <InputEncoding>utf-8</InputEncoding>
  <Tags></Tags>
</OpenSearchDescription>
