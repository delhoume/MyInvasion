This if a first "usable" version of a standalone (running under node.js with a local dev server) graphical editor
for manipulation of flashfiles (compact representations of lists of flashed mosaics in the FlashInvader game
by street artist Invader)

the offical FlashInvaders app does not allow exporting its flashes so this editor provides a way to edit them.

## In this POC we have

- all known to date space invaders with accurate status gathered from an API available on Awazleon web site
- a graphical view of these mosaics in 4 modes (flashed, all, complete cities, missing) with a 4 state button (bottom  left)
- a reference to a player in the game (called flasher) that provides a flashlist see raw-asset/flashers/
- mosaics can be displayed fom 3 per row to any number 
- you can click "edit" to enter edit mode.
  - in edit mode you can click on a thumbnail to toggle its flashed state (represented by a green mark)
  - all numbers  for flashes/cities are changed dynamically
  -  when marking as flashed you have the famous "tutulululu" sound( can be quite annoying ;-)
  -  when you are done with editing, the resulting flashfile is written in the browser's console and copied to clipboard.
- the initial flashlist  is currently a parameter in the code see WorlInvasion.GetInstance
- import and export (from clipboard) work on local dev but not in deployment as it needs https
- there is no external dependency, so all info for the invasion stats is in he repo, as well as all graphics
 (11 Mo only for all files).

- all invasion info is static for  now but will use the awazleon.space APIs when I will find out how to fix  the CORS  issue


There are a number of issues and opened questions as this is WIP
- How to deal with status / new cities / new space invaders not currently known
  - new thumbnails
  - be notified / or check for changes in REST apis fo new invaders  / status change
  - where to load / save the flashlist (could be integrated with well know sites (awazleon, invaderspotter) that allow storage of flashed state

 ## TODO first
    - fix CORS and us awazleon.space APIs
    - often there are issues with not loaded fonts
    - have visual feedbak of actions 
    - 
    
  - useful features lacking
   - ability to declare ranges of swap flash status (long press ?) / multiple selection.
 
- performance is very good thanks to the Pixi.js library used here.
- about 4300 sprites are displayed in real-time on a 2020 mac mini.

If you are interested in developing this project feel free to contact me.

How to run ?
- you have to install node.js
  - clone the git
  - npm install
  - npm run dev

- deployment use a static web server with the dist folder
- npx vite build
 
    <img width="854" alt="image" src="ht<img width="751" height="1024" alt="image" src="https://github.com/user-attachments/assets/b78ccbff-7ad0-4194-96ee-6905eff9a935" />
tps://github.com/user-attachments/assets/3212be35-9149-41fc-a27e-c41502a75b76" />
