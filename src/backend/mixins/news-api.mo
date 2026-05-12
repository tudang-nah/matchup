import Types "../types/common";
import Time "mo:core/Time";
import Text "mo:core/Text";
import List "mo:core/List";

mixin (
  newsCache : { var items : [Types.NewsItem]; var fetchedAt : Int },
) {

  // ---- JSON helpers ----

  func extractStringValue(rest : Text) : Text {
    switch (rest.trimStart(#char ' ').stripStart(#text "\"")) {
      case null { "" };
      case (?inner) {
        let chars = inner.toIter();
        let buf   = List.empty<Char>();
        label reading loop {
          switch (chars.next()) {
            case null { break reading };
            case (?c) {
              if (c == '\"') { break reading };
              buf.add(c);
            };
          }
        };
        Text.fromIter(buf.values())
      };
    }
  };

  func jsonGetString(json : Text, key : Text) : Text {
    let needle = "\"" # key # "\":";
    let parts  = json.split(#text needle);
    switch (parts.next()) {
      case null { "" };
      case (?_) {
        switch (parts.next()) {
          case null { "" };
          case (?rest) { extractStringValue(rest) };
        }
      };
    }
  };

  func jsonGetSourceName(json : Text) : Text {
    let parts = json.split(#text "\"source\":");
    switch (parts.next()) {
      case null { "" };
      case (?_) {
        switch (parts.next()) {
          case null { "" };
          case (?srcBlock) { jsonGetString(srcBlock, "name") };
        }
      };
    }
  };

  func splitArticles(body : Text) : [Text] {
    let parts = body.split(#text "\"articles\":[");
    switch (parts.next()) {
      case null { [] };
      case (?_) {
        switch (parts.next()) {
          case null { [] };
          case (?afterMarker) {
            let articles = List.empty<Text>();
            let raw      = afterMarker.split(#text "},{");
            var first    = true;
            for (chunk in raw) {
              let cleaned = if (first) {
                first := false;
                chunk.trimStart(#char '{')
              } else {
                chunk
              };
              let stripped =
                switch (cleaned.stripEnd(#text "]}")) {
                  case (?s) { s };
                  case null {
                    switch (cleaned.stripEnd(#text "]")) {
                      case (?s) { s };
                      case null { cleaned };
                    }
                  };
                };
              if (not stripped.isEmpty()) { articles.add(stripped) }
            };
            articles.toArray()
          };
        }
      };
    }
  };

  // ---- Public API ----

  public func getHotNews() : async [Types.NewsItem] {
    let cacheTtl : Int = 30 * 60 * 1_000_000_000;
    let apiUrl = "https://newsapi.org/v2/top-headlines?category=sports&language=en&pageSize=20&apiKey=fce584f059744a489f5cca7a02a6aced";

    let now = Time.now();
    if (newsCache.fetchedAt > 0 and (now - newsCache.fetchedAt) < cacheTtl) {
      return newsCache.items;
    };

    let ic = actor "aaaaa-aa" : actor {
      http_request : ({
        url               : Text;
        max_response_bytes : ?Nat64;
        method            : { #get; #head; #post };
        headers           : [{ name : Text; value : Text }];
        body              : ?Blob;
        transform         : ?{
          function : shared ({
            response : {
              status  : Nat;
              headers : [{ name : Text; value : Text }];
              body    : Blob;
            };
            context : Blob;
          }) -> async {
            status  : Nat;
            headers : [{ name : Text; value : Text }];
            body    : Blob;
          };
          context : Blob;
        };
        is_replicated : ?Bool;
      }) -> async { status : Nat; headers : [{ name : Text; value : Text }]; body : Blob };
    };

    try {
      let response = await ic.http_request({
        url               = apiUrl;
        max_response_bytes = ?500_000;
        method            = #get;
        headers           = [{ name = "User-Agent"; value = "MatchUp/1.0" }];
        body              = null;
        transform         = null;
        is_replicated     = ?false;
      });

      if (response.status != 200) {
        return newsCache.items;
      };

      let bodyText = switch (response.body.decodeUtf8()) {
        case null { return newsCache.items };
        case (?t) { t };
      };

      let articleChunks = splitArticles(bodyText);
      let items = List.empty<Types.NewsItem>();
      var idx : Nat = 0;

      for (chunk in articleChunks.values()) {
        let title       = jsonGetString(chunk, "title");
        let description = jsonGetString(chunk, "description");
        let imageUrl    = jsonGetString(chunk, "urlToImage");
        let url         = jsonGetString(chunk, "url");
        let source      = jsonGetSourceName(chunk);
        let publishedAt = jsonGetString(chunk, "publishedAt");

        if (not title.isEmpty() and title != "[Removed]") {
          items.add({
            id = idx.toText();
            title;
            description;
            imageUrl;
            url;
            source;
            publishedAt;
            sport = "sports";
          });
          idx += 1;
        }
      };

      let result = items.toArray();
      newsCache.items     := result;
      newsCache.fetchedAt := now;
      result
    } catch (_) {
      newsCache.items
    }
  };
};
