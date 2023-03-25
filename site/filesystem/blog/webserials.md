Date: 2023-03-25

Some people unwind with a show or movie when they want to relax; when I'm in that mood, I prefer to read serialized fiction published on [RoyalRoad](https://www.royalroad.com/).

For those unfamiliar with the concept, serialized stories are written one chapter at a time, with authors posting chapters as they complete them.

Many read these chapters as they are released on the site, while others who wish to support the author or are eager for more content may read advanced chapters from the author's Patreon.

I find reading on my computer or phone substantially worse to reading on my eReader (I have a [Kobo](https://ca.kobobooks.com/products/kobo-libra-2)). This is the primary motivation behind a collection of software I've written, which is the topic of today's blog post.

## Components of My Custom Setup

My setup has evolved over the years, but currently, it consists of two main components:

1. A Django application that fetches new chapters, rebuilds epubs, and stores them in my [Calibre](https://calibre-ebook.com/) library.
2. A [Plato hook](https://github.com/buckley-w-david/plato-calibre) running from a [forked Plato build](https://github.com/buckley-w-david/plato/tree/update-document-event).

### The Django Application

The Django application serves two main functions:

1. Provide a UI for me to follow new stories.
2. Monitor chapter updates and rebuild epubs as needed.

The UI is a convenient way for me to add stories to the system. It features a simple HTML page with an input box for story URLs and a list of subscribed stories. When a new story is added, browser automation is triggered to open the site, log in to my account, and follow the story. This replaced a browser extension I wrote that intercepted the "follow" button on the site and triggered an API request to signal the previous iteration of the system to pull the story.

Once a story is followed, new chapter notification emails are sent to a dedicated email inbox.

A background task in the app uses [imap_tools](https://github.com/ikvk/imap_tools) to listen for these chapter notifications. It is responsible for creating new chapter entries and initiating the epub generation process.

Although basing this automation on emails is somewhat clunky, it allows me to be a responsible consumer by only pulling data from RoyalRoad when new content is available. This replaced a previous system where epub generation occurred on a schedule, regardless of whether new content was available.

### Plato

I use a reader called Plato. I prefer it to the default reader due to its more advanced features, and to the more popular [KOReader](https://github.com/koreader/koreader) due to superior performance. Some of these stories have been consistently releasing chapters multiple times a week for years, resulting in very large epubs. KOReader seems to render the entire file at once, causing noticeable lag when opening or adjusting settings such as font size for these stories. Plato does not have this issue.

Plato supports a feature called "Hooks," which allows users to run certain binaries when entering a directory, communicating with Plato via stdin and stdout using a simple JSON-based RPC communication protocol. This protocol is why I use a forked version of Plato. The original build does not support updating books with new content in place, which is exactly what I want to do when a new version of the epub is available. I could remove the old version and add the new one, but then I would have to find my place again for every book each time I updated.

I use a combination of the [calibre content server API](https://github.com/kovidgoyal/calibre/tree/master/src/calibre/srv) (Mostly undocumented, but I have written some [docs](https://github.com/buckley-w-david/calibre-content-server-swagger/tree/master) myself) and the RPC protocol to pull new epubs and update them on my device.

### Diagram

~~~mermaid
sequenceDiagram
    participant UI as User Interface
    participant Django_App as Django Application
    participant RR as RoyalRoad
    participant Email as Email Inbox
    participant Calibre as Calibre Library
    participant Plato as Plato Reader

    par 
        UI->>Django_App: Add new story URL
        Django_App->>RR: Request story information, follow story
        RR-->>Django_App: Return Story Information
        Django_App->>Calibre: Build epub and store
    and
        RR->>Email: Send chapter notifications
        Email->>Django_App: Notify about new chapters
        Django_App->>RR: Fetch new chapters
        RR-->>Django_App: Return Story Information
        Django_App->>Calibre: Rebuild epub and store
    and
        Plato->>Calibre: Fetch updated epub
        Calibre-->>Plato: Return epub content
    end
~~~

## Ethics

I recognize that this system may be considered unethical, specifically because I benefit from RoyalRoad without providing anything in return. They cannot generate ad revenue to support their hosting efforts if I automate my interactions with the site.

To compensate for this, I pay for their premium reader membership. They receive more revenue from my subscription than they ever would from my regular browsing (especially since I use an ad blocker).

This is also why the main portion of this setup, the Django application, is not publicly available. Since I cannot ensure that users of the application would contribute back to make up for it, I am not comfortable facilitating potential abuse by providing access.
