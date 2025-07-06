This if a first "usable" version of a standalone (running under node.js withh a local server) graphical editor
for manipulation of flashfiles (compact representations of lists of flashed mosaics in the FlashInvader game
by street artist Invader)

the offical FlashInvaders app does not allow exporting its flashes so this editor provides a way to edit them.

In this first POC we have

- all known to date space invaders with accurate status gathered from an API available on Awazleon web site
- a graphical view of these mosaics in 3 modes (flashed, all, missing) with a 3 state button (bottom  left)
- a reference to a player in the game (called flasher) that provides a flashlist see raw-asset/flashers/
- mosaics can be displayed fom 3 per row to 18
- when in "all" mode you can click "edit" to enter edit mode.
  - in edit mode you can click on a thumbnail to toggle its flashed state (represented by a green mark)
  - all numbers  for flashes/cities are changed dynamically
  -  when marking as flashed you have the famous "tutulululu" sound( can be quite annoying ;-)
  -  when you are done with editing, the resulting flashfile is written in the browser's console and copied to clipboard.
- the initial flashlist  is currently a parameter in the code see WorlInvasion.GetInstance

- there is no external dependency, so all info for the invasion stats is in he repo, as well as all graphics
 (11 Mo only for all files).

- a possible future version could be hosted on the web and all invasion numbers and status could come
 from an API.

There are a number of issues and opened questions as this is WIP
- How to deal with status / new cities / new space invaders not currently known
  - new thumbnails
  - be notified / or check for changes in REST apis
  - where to load / save the flashlist (could be intgegrated with well know sites (awazleon, invaderspotter) that allow storage of flashed state

  - many bugs / glitches
    - bad fonts (should be mostly space-invaders.tff)
    - buttons are ugly
    - slider for tiles-per-row is quite good looking. ;-)
    - 
  - useful features lacking
    - ediable date of flash
   - ability to declare ranges of swap flash status (long press ?) / multiple selection.
 
- performance is very good thanks to the Pixi.js library used here.
- about 4300 sprites are displayed in real-time on a 2020 mac mini.

If you are inteersted in developing this project feel free to contact me.

How to run ?
- you have to install node.js
  - clone the git
  - npm install
  - npm run dev
 
    <img width="854" alt="image" src="https://github.com/user-attachments/assets/3212be35-9149-41fc-a27e-c41502a75b76" />
