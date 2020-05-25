Pranav (05-22-20)
1. Created this file, make sure to accurately report all your changes
2. Somehow, the movement distances or something related to them were changed, allowing the character to leave the road. Fixed that.
3. Made sure the health can't be more than maxHealth (constant at the top of the program) or less than -60 (dies at 0, -60 is how long he lasts before the explosion consumes him).
4. If health goes below 0, trigger an explosion, and once the explosion is max size, stop drawing him. And once the explosion is done, don't even check the draw function.
5. Made a few constants to use in health checking, color, whether to draw or not, whether to start an explosion.
Thoughts:
We all need to separate out into roles, so we don't interfere with each others code. Moreover, we need to make sure we create our own branches and have our code looked over and experimented on by everyone before merging it. NEVER MERGE INTO MASTER UNTIL 2-3 OF US CHECKS IT.
Roles (temporary):
Pranav: Movement mechanics, playable world/level building (including boundaries)
Suvir: 
Jacob: 
Chang:
Try not to interfere with someone else's role, it can create confusion. If you think something needs to be done by the other roles, let them know. Also, shadowing should probably be shared by two people.
Planning on using this tomorrow for the presentation. 
