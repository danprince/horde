# Horde

Create the largest horde possible by roaming the steppe, searching for resources and recruits, and battling other hordes.

The game always starts as a single rider, playing in a (potentially infinite) world, where you have to search for resources (point and click) and avoid danger.

- Need to think about logic for controlling a horde as a single unit. Follow the leader? Move everyone together?
- Is combat active or passive? Put the horde near another horde and they'll passively fight? Or lean towards Agar.io mechanics and just have the larger horde consume the smaller one?
- What else would you do other than exploration and combat?
  - Find food/water
  - Meet traders
  - Visit villages of yurts
- Currencies?
  - Silver/taels
  - Silk
  - Reputation
  - Food
  - Horde size
  - Terror?

What is the mechanic for growing the horde? In some cases, just ride up to them. In other cases an agressive unit needs to be pacified first. Do this with javelins?

Need to get sprite recoloring working to have good visual variety within hordes.

If the world is truly open, then will need to think about a chunk representation. Would need 1, 4 or 9 chunks in memory at all times.

Could technically reduce the sprite count from 8 to 5, then flip for the missing 3 directions.

Figure out how to model the world. Square cells? Square cells with offsets to make them less grid like?

Move everyone with dijkstra? Create a dijkstra map from target back to all units, then just have everyone go downhill?

Architecture?
- Improved/cancellable pathing

Simplifications:
- Horde influence is defined by leader radius
- As horde grows leader's influence grows
- When leader moves other horde members path to point near leader's destination
- If uninfluenced unit enters horde members influence, join the horde
- Horde should have single colour to show clearly when influence switches
- Horde color can be randomly generated (hsl)
- Projectile hits can de-influence horde members (timer before can rejoin original horde)
- Horde combat essentially involves a bit of javelin and a bit of pushing/chasing.
- Uninfluenced riders will try to escape large hordes
