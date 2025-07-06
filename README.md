This if a first "usable" version of a standalone (running under node.js withh a local server) graphical editor
for manipulationflashfils (lists of compact representations of flashed mosaics in the FlashInvader game
by street artist Invader

the offical FlashInvaders app does not allow exporting its flashes so this editor provides a way to edit them.

In this first POC we have

- all known to date space invaders with accurate status gathered from an API availbale on Awazleon web site
- a graphical view of these mosaics in 3 modes (flashed, all, missing) ith a 3 state button (bottom  left)
- a reference to a player in the game (called flasher) that provides a flashlist see raw-asset/flashers/
- mosaics can be displayed fom 3 per row to 18
- when in "all" mode you can click "edit"t enter edit mode.
  - in edit mode you can click ona thumnail tyo toggle its flashed state (represented by a green mark
  - all numbers are changed dynamically
  -  when marking as flashed you have the famous "tutulululu" sound( can be quite annoying ;-)
  -  when you are done with editing, the resulting flashfile is writtnt in the browser's console and copied to clipboard.
- the initial flashlist  is currently a parameter in the code see WorlInvasion.GetInstance

- thee is no external dependency, so all info for the invasion stats is in he repo, as well as all graphics
 (11 Mo only for all files).

- a possible future version could be hosted on the web and all invasion numbers and status could come
 from an API.

There are a number of issues and opened questions as this is WIP
- How to deal with status / new cities / new space invaders not currently known
  - new thumbnails
  - be notified / or check for hnags in RET apis
  - where to load / save the flashlist (could be par of well know sites (awazleon, invaderspotter)
  - many bugs / glitches
    - bad fonts (should be mostly space-invaders.tff)
    - buttons are ugly
    - slider for tiles-per-row is quiteg ood looking. ;-)
   
- performance is very good thanks to the Pixi.js library used here.
- about 4300 sprites are displayed in real-time on a 2020 mac mini.

If you are inteersted in developing this project feel free to contact me.

How to run ?
- you have to install node.js
  - clone the git
  - npm install
  - npm run dev
 
    <img width="854" alt="image" src="https://github.com/user-attachments/assets/3212be35-9149-41fc-a27e-c41502a75b76" />
