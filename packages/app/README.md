# Relar
The Relar app.

## Design
- https://www.google.com/search?q=spotify+designdesktop&tbm=isch&ved=2ahUKEwjojKiWlM3pAhUOWN8KHeZQCiwQ2-cCegQIABAA&oq=spotify+designdesktop&gs_lcp=CgNpbWcQA1CVjQFY65UBYNCXAWgAcAB4AIABV4gBkwSSAQE3mAEAoAEBqgELZ3dzLXdpei1pbWc&sclient=img&ei=scDKXqjwNI6w_QbmoangAg&bih=969&biw=1920&rlz=1C5CHFA_enCA844CA844#imgrc=fxJYISR_VqJU7M
- https://theappsolutions.com/blog/development/develop-spotify-like-app/
- https://medium.com/acquaint-softtech/a-step-by-step-guide-to-create-music-streaming-apps-fa4a19f4bd0f
- https://www.cleveroad.com/blog/how-to-create-a-music-streaming-app

## TODO
- CORS only local and whatever deployment url
- add shortcuts for tabs (e.g. "/" for search tab)
- Move fonts to public dir
- Think about limiting firestore data that you download
- Error boundary
- docracy. com

## Docs
- Document how album thumbnails are stored
- Document how songs are stored
- Document firestore structure
- Snippets (className, Sentry)

## Before Beta
- Add stats recorder. ie. how many people use "x" and how many people make firestore call "y". I will need this info to optimize usage before the release.
- How to turn off sign-ups? Because it will be a email based sign up.
- Customize email templates.
- Ensure you are using server timestamps.
- Limit storage.
- Add analytics.
- Ensure firebase rules are as strict as possible.
- Does firebase have suspicious activity monitoring?
- Ensure all errors are reported to Sentry. Test unhandled in production.
- Add contact info to app to comply with GDPR.
- Make sure I am complying with all GDPR.
  - Maybe limit IP addresses to US and Canada?
- Switch to Blaze but add budget alert information.
- Add "Recently Added" playlist that watches for new songs.
- Method to contact! A dedicated email?
- Ensure sentry is correctly configured.
- Read through https://twitter.com/LareneLg/status/1262197938685530113.
- Skip to main content link.
- Add action email handler: https://firebase.google.com/docs/auth/custom-email-handler
- What if the user signs out? Do we automatically catch that?
- Some kind of forum for bug/feature upvoting!
- Set up testing project since we don't want to run tests in production :/
- Sync security rules with testing.

## Before Release
- Limit sign ups to "x" amount of people based on usage info from beta to stay within your price range (ideally the free). Or maybe just budget alerts.
- Add backups. Use coldline storage for storage backups.
- Support different currencies.

## Monitoring
- Monitor billing reports to see what is costing me the most money.
- Set up stackdriver.

## Other
- Create dev environment so I don't have to be worried about deleting production data

## Resources
- https://www.youtube.com/watch?v=iWEgpdVSZyg&feature=emb_rel_end