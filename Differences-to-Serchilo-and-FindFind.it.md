- *Main difference*: search queries are not sent out to the server, all processing is done in the client.
  - Thus, your search queries remain private.
  - Instead in a database, shortcuts are kept in [text files, named after their syntax](https://github.com/trovu/trovu-data/blob/master/shortcuts/o/g/1.txt).
- Since all is done on the client and there is no database, you need to host your user shortcuts yourself. 
  - However, that's easy: For instance, simply [fork this Github repository](https://github.com/trovu/trovu-data-user) and edit it to your needs (see also Migration below).
- country namespaces are not 3-letter but 2-letter-codes, prefixed with a dot, e.g.
  - `.de`, not `deu`

You can [[migrate your settings and user shortcuts from FindFind.it|Migrate from FindFind.it]].