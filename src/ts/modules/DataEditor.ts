// @ts-nocheck
import DataManager from "./DataManager";

export default class DataEditor {
  editData() {
    const data = DataManager.load();
    // this.editLastfm(data);
    this.add0arg(data);
    DataManager.write(data);
  }

  private add0arg(data: {}) {
    const namespace = "o";
    for (const key in data.shortcuts[namespace]) {
      if (!key.startsWith("h")) {
        continue;
      }
      if (!data.shortcuts[namespace][key].url) {
        continue;
      }
      if (data.shortcuts[namespace][key].url.match(/www.google/)) {
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
      data.shortcuts[namespace][key0arg] = JSON.parse(JSON.stringify(data.shortcuts[namespace][key]));
      const url = data.shortcuts[namespace][key0arg].url;
      const protocolAnddomain = url.match(/(https?:\/\/[^/]+)/)[1];
      data.shortcuts[namespace][key0arg].url = protocolAnddomain + "/";
      data.shortcuts[namespace][key0arg].examples = [
        {
          description: "Go to the homepage",
        },
      ];
      delete data.shortcuts[namespace][key].title;
      delete data.shortcuts[namespace][key].tags;
      data.shortcuts[namespace][key].include = key0arg;
    }
  }

  private editLastfm(data: {}) {
    for (const namespace in data.shortcuts) {
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
