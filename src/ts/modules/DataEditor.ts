import DataManager from "./DataManager";
import type { RawShortcutObject, RawShortcutMap, TrovuData } from "../types";

export default class DataEditor {
  editData() {
    const data = DataManager.load();
    // this.editLastfm(data);
    this.add0arg(data);
    DataManager.write(data);
  }

  private add0arg(data: TrovuData) {
    const namespace = "o";
    const shortcuts = data.shortcuts?.[namespace];
    if (!shortcuts) {
      return;
    }
    for (const key in shortcuts) {
      if (!key.startsWith("n")) {
        continue;
      }
      const rawShortcut = shortcuts[key];
      const shortcut: RawShortcutObject = typeof rawShortcut === "string" ? { url: rawShortcut } : rawShortcut;
      const shortcutUrl = typeof shortcut.url === "string" ? shortcut.url : "";
      if (!shortcutUrl) {
        continue;
      }
      if (shortcutUrl.match(/www.google/)) {
        continue;
      }
      const [keyword, argCount] = key.split(" ");
      if (argCount !== "1") {
        continue;
      }
      const key0arg = `${keyword} 0`;
      if (data.shortcuts[namespace].hasOwnProperty(key0arg)) {
        continue;
      }
      shortcuts[key0arg] = JSON.parse(JSON.stringify(shortcut)) as RawShortcutObject;
      const zeroArgShortcut = shortcuts[key0arg] as RawShortcutObject;
      const url = typeof zeroArgShortcut.url === "string" ? zeroArgShortcut.url : "";
      const protocolAnddomain = url.match(/(https?:\/\/[^/]+)/)[1];
      zeroArgShortcut.url = protocolAnddomain + "/";
      zeroArgShortcut.examples = [
        {
          description: "Go to the homepage",
        },
      ];
      const urlTest = shortcutUrl.replace(/<query>/g, "test");
      console.log(urlTest);
      delete shortcut.title;
      delete shortcut.tags;
      shortcut.include = key0arg;
      shortcuts[key] = shortcut;
    }
  }

  private editLastfm(data: TrovuData) {
    for (const namespace in data.shortcuts || {}) {
      const key = "last 1";
      if (data.shortcuts[namespace].hasOwnProperty(key)) {
        data.shortcuts[namespace][key] = {
          deprecated: {
            alternative: {
              query: "lfm 1",
            },
            created: "2024-11-17",
          },
        };
        data.shortcuts[namespace]["lfm 0"] = {
          include: {
            key: "lfm 0",
            namespace: "de",
          },
        };
        data.shortcuts[namespace]["lfm 1"] = {
          include: {
            key: "lfm 1",
            namespace: "de",
          },
        };
      }
    }
    data.shortcuts["o"]["lfm 0"] = {
      url: "https://www.last.fm/",
      title: "Last.fm",
      description:
        "Last.fm is a music website that offers personalized internet radio, using a recommendation system called Audioscrobbler to build a detailed profile of users based on their music tastes.",
      tags: ["music", "radio", "recommendation"],
      examples: [
        {
          description: "Go to the homepage",
        },
      ],
    };
    data.shortcuts["o"]["lfm 1"] = {
      url: "https://www.last.fm/search?q=<query>",
      include: "lfm 0",
      examples: [
        {
          arguments: "eminem",
          description: "Search for Eminem",
        },
      ],
    };
    data.shortcuts["de"]["lfm 0"] = {
      url: "https://www.last.fm/<$language>/",
      include: [
        {
          key: "lfm 0",
          namespace: "o",
        },
      ],
    };
    data.shortcuts["de"]["lfm 1"] = {
      url: "https://www.last.fm/<$language>/search?q=<query>",
      include: {
        key: "lfm 1",
        namespace: "o",
      },
    };
  }
}
