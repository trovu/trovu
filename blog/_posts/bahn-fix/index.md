---
title: Fix der Bahn-Fahrplanauskunft
description: Bitte das Userscript installieren (aber ohne geht auch was).
date: 2024-07-14
tags:
    - shortcut
    - german
---

Vor einigen Monaten hörte der Shortcut zur Fahrplanauskunft der Deutschen Bahn auf zu funktionieren (`db berlin, hamburg`). Grund dafür war, dass die Bahn ihre [alte Fahrplanauskunft](https://reiseauskunft.bahn.de/) nun endgültig abgeschaltet hatte.

Die neue Auskunft benötigte hingegen als Suchargument für den Ab- oder Ankunftsort nicht mehr nur den Namen (`berlin`), sondern auch dessen interne ID (`soid=…`). Damit konnte Trovu also nicht mehr direkt auf die Ergebnisseite weiterleiten.

Ich hatte in den vergangenen Monaten versucht, [auf vielen Wegen eine Lösung zu finden](https://github.com/trovu/trovu/issues/210), u.a. bei mehreren Stellen der Deutschen Bahn und in einem Bahn-Nutzer-Forum gefragt. Ein direkter Link auf die Ergebnisseite scheint dennoch immer noch nicht möglich zu sein, ohne die ID zu kennen.

Trotzdem gibt es jetzt eine (experimentelle) Lösung. Damit diese vollständig funktioniert, sollte auf Eurem Rechner ein sogenanntes Userscript installiert sein. Wie man das macht, ist hier [in der Dokumentation](https://trovu.net/docs/shortcuts/userscripts/) beschrieben.

Dann könnt Ihr wie gewohnt eine Suchanfrage starten, z.B.:

```
db berlin hamburg
db b,hh,21
dbn b,hh,8,mo  # Nur Nahverkehrszüge / mit Deutschlandticket
```

Diese Seite leitet Euch auf das Suchformular der Fahrplanauskunft, füllt es aber schon mit Euren Suchwerten aus. Das Userscript klickt dann auf den Suchen-Knopf. Wer das Userscript also nicht installiert hat, hat trotzdem etwas davon – er muss nur auf den Knopf selbst klicken.

Zwei Punkte bleiben offen – falls Ihr dazu Abhilfe wisst, schreibt es gern [ins Ticket](https://github.com/trovu/trovu/issues/210):

1. Das Userscript ist experimentell: Der Suchen-Knopf ist nicht sofort klickbar, weil offenbar die Seite im Hintergrund noch lädt. Idealerweise löst man das mit `window.onload` oder `DOMContentLoaded` – allerdings funktionierten diese Methoden nicht. Es ist jetzt mit einem `setTimeout` von 4 Sekunden gelöst.
1. Die Bestpreissuche (`dbb`) funktioniert immer noch nicht. Ich habe noch nicht den passenden Parameter in der URL gefunden, die beim Klick auf _Suchen_ sofort die Bestpreise anzeigt.

Schreibt auch sonst gern ins Ticket (oder auf [anderen Wegen](https://trovu.net/docs/users/support/)), wie gut der aktualisierte Shortcut für Euch funktioniert.
