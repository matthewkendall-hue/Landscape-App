/**
 * City-to-Plant mapping for all 50 US states.
 * Each state has 3 major cities with native plant recommendations.
 * Plant IDs reference entries in nativePlants.js (np- prefix).
 * Plants not found in nativePlants.js are silently skipped at runtime.
 */

// Reusable plant-ID sets by region (to keep city entries concise)
const SE_TREES = ['np-live-oak','np-southern-magnolia','np-bald-cypress','np-eastern-redbud','np-crape-myrtle','np-sweetgum','np-tulip-poplar','np-red-maple','np-loblolly-pine','np-longleaf-pine','np-american-holly'];
const SE_SHRUBS = ['np-beautyberry','np-oakleaf-hydrangea','np-virginia-sweetspire','np-azalea-native','np-yaupon-holly','np-spicebush','np-sweetshrub','np-fothergilla'];
const SE_GROUND = ['np-muhly-grass','np-coral-honeysuckle','np-purple-coneflower','np-black-eyed-susan','np-inland-sea-oats','np-christmas-fern','np-foamflower','np-woodland-phlox'];

const NE_TREES = ['np-sugar-maple','np-red-oak','np-white-oak','np-red-maple','np-white-pine','np-american-beech','np-flowering-dogwood','np-black-tupelo','np-eastern-hemlock','np-serviceberry','np-sassafras','np-tulip-poplar'];
const NE_SHRUBS = ['np-witch-hazel','np-inkberry','np-mountain-laurel','np-bayberry','np-winterberry','np-fothergilla','np-rhododendron','np-summersweet','np-chokeberry-red','np-elderberry'];
const NE_GROUND = ['np-wild-ginger','np-christmas-fern','np-foamflower','np-columbine','np-joe-pye-weed','np-bee-balm','np-new-england-aster','np-pennsylvania-sedge','np-wild-strawberry','np-bloodroot','np-solomon-seal'];

const MW_TREES = ['np-bur-oak','np-hackberry','np-red-maple','np-honeylocust','np-kentucky-coffeetree','np-ironwood','np-american-linden','np-serviceberry','np-eastern-red-cedar','np-paper-birch'];
const MW_SHRUBS = ['np-ninebark','np-viburnum-dentatum','np-viburnum-trilobum','np-buttonbush','np-red-osier-dogwood','np-elderberry','np-smooth-sumac','np-leadplant'];
const MW_GROUND = ['np-purple-coneflower','np-black-eyed-susan','np-prairie-dropseed','np-big-bluestem','np-little-bluestem','np-switchgrass','np-wild-bergamot','np-blazing-star','np-butterfly-milkweed','np-goldenrod'];

const SW_TREES = ['np-palo-verde','np-mesquite','np-desert-willow','np-arizona-cypress','np-ironwood-desert','np-texas-mountain-laurel','np-pinon-pine'];
const SW_SHRUBS = ['np-jojoba','np-creosote','np-brittlebush','np-chuparosa','np-texas-sage','np-agarito','np-desert-spoon','np-ocotillo','np-apache-plume','np-fourwing-saltbush','np-cenizo'];
const SW_GROUND = ['np-agave-parryi','np-agave-americana','np-yucca-filamentosa','np-desert-marigold','np-autumn-sage','np-blackfoot-daisy','np-red-yucca','np-globe-mallow','np-damianita','np-blue-grama','np-desert-zinnia','np-mealy-blue-sage'];

const PNW_TREES = ['np-douglas-fir','np-western-red-cedar','np-vine-maple','np-pacific-madrone','np-bigleaf-maple','np-oregon-white-oak','np-pacific-dogwood','np-cascara','np-sitka-spruce'];
const PNW_SHRUBS = ['np-oregon-grape','np-salal','np-red-huckleberry','np-pacific-rhododendron','np-red-flowering-currant','np-oceanspray','np-nootka-rose','np-snowberry'];
const PNW_GROUND = ['np-sword-fern','np-deer-fern','np-kinnikinnick','np-bunchberry','np-inside-out-flower','np-douglas-aster','np-tufted-hairgrass'];

const MTN_TREES = ['np-quaking-aspen','np-blue-spruce','np-rocky-mtn-juniper','np-ponderosa-pine','np-limber-pine','np-mountain-mahogany','np-narrowleaf-cottonwood'];
const MTN_SHRUBS = ['np-rabbitbrush','np-big-sagebrush','np-wax-currant','np-gambel-oak','np-fernbush','np-western-serviceberry','np-chokecherry-shrub'];
const MTN_GROUND = ['np-fireweed','np-penstemon-strictus','np-blanket-flower','np-blue-flax','np-sulphur-buckwheat','np-indian-paintbrush','np-kinnikinnick','np-prairie-smoke','np-yarrow'];

const CA_TREES = ['np-coast-live-oak','np-california-sycamore','np-valley-oak','np-california-bay-laurel','np-western-redbud','np-monterey-cypress','np-incense-cedar'];
const CA_SHRUBS = ['np-toyon','np-manzanita','np-ceanothus','np-coffeeberry','np-lemonade-berry','np-sugar-bush','np-california-fuchsia','np-island-bush-poppy'];
const CA_GROUND = ['np-matilija-poppy','np-california-poppy','np-california-fescue','np-deer-grass','np-creeping-sage','np-seaside-daisy','np-woolly-blue-curls'];

const FL_TREES = ['np-live-oak','np-sabal-palm','np-bald-cypress','np-southern-magnolia','np-sweetbay-magnolia','np-slash-pine','np-dahoon-holly','np-mahogany','np-gumbo-limbo','np-sea-grape'];
const FL_SHRUBS = ['np-firebush','np-coontie','np-saw-palmetto','np-simpson-stopper','np-walter-viburnum','np-wild-coffee','np-beautyberry','np-dwarf-palmetto'];
const FL_GROUND = ['np-beach-sunflower','np-sunshine-mimosa','np-muhly-grass','np-blue-eyed-grass','np-lantana-native','np-blue-flag-iris'];

const TX_TREES = ['np-live-oak','np-eastern-redbud','np-bald-cypress','np-crape-myrtle','np-desert-willow','np-texas-mountain-laurel','np-texas-persimmon','np-mesquite','np-red-maple'];
const TX_SHRUBS = ['np-yaupon-holly','np-texas-sage','np-agarito','np-beautyberry','np-cenizo','np-virginia-sweetspire'];
const TX_GROUND = ['np-muhly-grass','np-autumn-sage','np-blackfoot-daisy','np-red-yucca','np-turks-cap','np-mealy-blue-sage','np-inland-sea-oats','np-purple-coneflower'];

function shade(ids) { return { name: 'Shade Garden', plantIds: ids }; }
function poll(ids) { return { name: 'Pollinator', plantIds: ids }; }
function drought(ids) { return { name: 'Drought Tolerant', plantIds: ids }; }
function rain(ids) { return { name: 'Rain Garden', plantIds: ids }; }
function prairie(ids) { return { name: 'Prairie Meadow', plantIds: ids }; }
function woodland(ids) { return { name: 'Woodland', plantIds: ids }; }
function desert(ids) { return { name: 'Desert Xeriscape', plantIds: ids }; }
function tropical(ids) { return { name: 'Tropical', plantIds: ids }; }

export const US_STATES = [
  // ─── ALABAMA ───
  { code: 'AL', name: 'Alabama', cities: [
    { name: 'Birmingham', usdaZone: '7b', lat: 33.52, lng: -86.81, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND],
      themes: [shade(['np-eastern-redbud','np-azalea-native','np-fothergilla','np-christmas-fern','np-foamflower','np-woodland-phlox']),
               poll(['np-beautyberry','np-virginia-sweetspire','np-coral-honeysuckle','np-purple-coneflower','np-black-eyed-susan']),
               drought(['np-live-oak','np-yaupon-holly','np-crape-myrtle','np-muhly-grass','np-loblolly-pine'])] },
    { name: 'Mobile', usdaZone: '8b', lat: 30.69, lng: -88.04, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, 'np-sabal-palm','np-saw-palmetto','np-dwarf-palmetto'],
      themes: [shade(['np-southern-magnolia','np-sweetbay-magnolia','np-dwarf-palmetto','np-christmas-fern']),
               poll(['np-beautyberry','np-coral-honeysuckle','np-purple-coneflower','np-black-eyed-susan']),
               rain(['np-bald-cypress','np-sweetgum','np-virginia-sweetspire','np-blue-flag-iris'])] },
    { name: 'Huntsville', usdaZone: '7a', lat: 34.73, lng: -86.59, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, 'np-white-oak','np-shagbark-hickory','np-witch-hazel'],
      themes: [shade(['np-eastern-redbud','np-witch-hazel','np-spicebush','np-foamflower','np-christmas-fern','np-solomon-seal']),
               poll(['np-oakleaf-hydrangea','np-purple-coneflower','np-black-eyed-susan','np-blazing-star','np-bee-balm']),
               woodland(['np-white-oak','np-tulip-poplar','np-sassafras','np-fothergilla','np-woodland-phlox'])] },
  ]},

  // ─── ALASKA ───
  { code: 'AK', name: 'Alaska', cities: [
    { name: 'Anchorage', usdaZone: '4b', lat: 61.22, lng: -149.90,
      plantIds: ['np-sitka-spruce','np-alaska-cedar','np-paper-birch','np-quaking-aspen', 'np-red-osier-dogwood','np-snowberry', ...PNW_GROUND, 'np-labrador-tea','np-alaska-blueberry','np-fireweed'],
      themes: [shade(['np-sitka-spruce','np-alaska-cedar','np-bunchberry','np-deer-fern']),
               poll(['np-fireweed','np-alaska-blueberry','np-red-osier-dogwood','np-tufted-hairgrass']),
               rain(['np-paper-birch','np-labrador-tea','np-tufted-hairgrass','np-bunchberry'])] },
    { name: 'Fairbanks', usdaZone: '2a', lat: 64.84, lng: -147.72,
      plantIds: ['np-paper-birch','np-quaking-aspen','np-alaska-birch','np-red-osier-dogwood','np-snowberry','np-fireweed','np-labrador-tea','np-alaska-blueberry','np-kinnikinnick','np-bunchberry','np-fireweed-ak'],
      themes: [shade(['np-paper-birch','np-bunchberry','np-labrador-tea']),
               poll(['np-fireweed','np-alaska-blueberry','np-red-osier-dogwood']),
               drought(['np-quaking-aspen','np-kinnikinnick','np-alaska-birch'])] },
    { name: 'Juneau', usdaZone: '7a', lat: 58.30, lng: -134.42,
      plantIds: ['np-sitka-spruce','np-alaska-cedar','np-paper-birch','np-quaking-aspen','np-vine-maple', ...PNW_SHRUBS, ...PNW_GROUND, 'np-labrador-tea','np-alaska-blueberry','np-fireweed'],
      themes: [shade(['np-alaska-cedar','np-salal','np-deer-fern','np-bunchberry']),
               poll(['np-fireweed','np-red-flowering-currant','np-alaska-blueberry']),
               rain(['np-sitka-spruce','np-labrador-tea','np-tufted-hairgrass'])] },
  ]},

  // ─── ARIZONA ───
  { code: 'AZ', name: 'Arizona', cities: [
    { name: 'Phoenix', usdaZone: '9b', lat: 33.45, lng: -112.07, plantIds: [...SW_TREES, ...SW_SHRUBS, ...SW_GROUND],
      themes: [desert(['np-palo-verde','np-agave-americana','np-red-yucca','np-desert-spoon','np-ocotillo','np-desert-marigold']),
               poll(['np-chuparosa','np-desert-willow','np-globe-mallow','np-autumn-sage','np-blackfoot-daisy']),
               drought(['np-mesquite','np-ironwood-desert','np-jojoba','np-creosote','np-agave-parryi'])] },
    { name: 'Tucson', usdaZone: '9a', lat: 32.22, lng: -110.97, plantIds: [...SW_TREES, ...SW_SHRUBS, ...SW_GROUND],
      themes: [desert(['np-palo-verde','np-agave-americana','np-red-yucca','np-ocotillo','np-desert-marigold']),
               poll(['np-chuparosa','np-desert-willow','np-globe-mallow','np-autumn-sage']),
               drought(['np-ironwood-desert','np-mesquite','np-jojoba','np-creosote','np-agave-parryi'])] },
    { name: 'Flagstaff', usdaZone: '5b', lat: 35.20, lng: -111.65, plantIds: [...MTN_TREES, ...MTN_SHRUBS, ...MTN_GROUND],
      themes: [woodland(['np-ponderosa-pine','np-gambel-oak','np-quaking-aspen','np-western-serviceberry','np-kinnikinnick']),
               poll(['np-rabbitbrush','np-penstemon-strictus','np-blanket-flower','np-indian-paintbrush']),
               drought(['np-pinon-pine','np-rocky-mtn-juniper','np-mountain-mahogany','np-big-sagebrush','np-blue-flax'])] },
  ]},

  // ─── ARKANSAS ───
  { code: 'AR', name: 'Arkansas', cities: [
    { name: 'Little Rock', usdaZone: '7b', lat: 34.75, lng: -92.29, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, ...MW_GROUND.slice(0,5)],
      themes: [shade(['np-eastern-redbud','np-spicebush','np-fothergilla','np-christmas-fern','np-foamflower']),
               poll(['np-beautyberry','np-virginia-sweetspire','np-purple-coneflower','np-blazing-star','np-bee-balm']),
               rain(['np-bald-cypress','np-sweetgum','np-red-maple','np-virginia-sweetspire'])] },
    { name: 'Fayetteville', usdaZone: '6b', lat: 36.08, lng: -94.17, plantIds: [...SE_TREES.slice(0,8), ...NE_SHRUBS.slice(0,5), ...MW_GROUND],
      themes: [prairie(['np-little-bluestem','np-switchgrass','np-purple-coneflower','np-blazing-star','np-wild-bergamot']),
               poll(['np-elderberry','np-purple-coneflower','np-butterfly-milkweed','np-blazing-star']),
               shade(['np-eastern-redbud','np-spicebush','np-witch-hazel','np-christmas-fern'])] },
    { name: 'Fort Smith', usdaZone: '7a', lat: 35.39, lng: -94.40, plantIds: [...SE_TREES.slice(0,8), 'np-hackberry','np-bur-oak', ...SE_SHRUBS, ...MW_GROUND],
      themes: [shade(['np-eastern-redbud','np-spicebush','np-christmas-fern','np-foamflower']),
               poll(['np-beautyberry','np-elderberry','np-purple-coneflower','np-butterfly-milkweed']),
               drought(['np-bur-oak','np-hackberry','np-yaupon-holly','np-little-bluestem'])] },
  ]},

  // ─── CALIFORNIA ───
  { code: 'CA', name: 'California', cities: [
    { name: 'Los Angeles', usdaZone: '10a', lat: 34.05, lng: -118.24, plantIds: [...CA_TREES, ...CA_SHRUBS, ...CA_GROUND],
      themes: [drought(['np-coast-live-oak','np-manzanita','np-ceanothus','np-toyon','np-deer-grass','np-california-fuchsia']),
               poll(['np-ceanothus','np-california-fuchsia','np-california-poppy','np-matilija-poppy','np-seaside-daisy']),
               shade(['np-california-bay-laurel','np-western-redbud','np-coffeeberry','np-california-fescue'])] },
    { name: 'San Francisco', usdaZone: '10b', lat: 37.77, lng: -122.42, plantIds: [...CA_TREES, ...CA_SHRUBS, ...CA_GROUND, 'np-pacific-madrone','np-salal'],
      themes: [drought(['np-coast-live-oak','np-manzanita','np-ceanothus','np-toyon','np-coffeeberry','np-deer-grass']),
               poll(['np-ceanothus','np-california-poppy','np-seaside-daisy','np-california-fuchsia']),
               shade(['np-california-bay-laurel','np-salal','np-california-fescue','np-creeping-sage'])] },
    { name: 'San Diego', usdaZone: '10b', lat: 32.72, lng: -117.16, plantIds: [...CA_TREES, ...CA_SHRUBS, ...CA_GROUND, 'np-agave-americana'],
      themes: [desert(['np-manzanita','np-sugar-bush','np-lemonade-berry','np-agave-americana','np-california-fuchsia','np-deer-grass']),
               poll(['np-ceanothus','np-california-fuchsia','np-california-poppy','np-seaside-daisy']),
               drought(['np-coast-live-oak','np-toyon','np-manzanita','np-coffeeberry','np-deer-grass'])] },
  ]},

  // ─── COLORADO ───
  { code: 'CO', name: 'Colorado', cities: [
    { name: 'Denver', usdaZone: '5b', lat: 39.74, lng: -104.99, plantIds: [...MTN_TREES, ...MTN_SHRUBS, ...MTN_GROUND, 'np-bur-oak','np-hackberry'],
      themes: [prairie(['np-little-bluestem','np-blue-grama','np-prairie-smoke','np-yarrow','np-penstemon-strictus','np-blue-flax']),
               poll(['np-rabbitbrush','np-penstemon-strictus','np-blanket-flower','np-sulphur-buckwheat']),
               drought(['np-rocky-mtn-juniper','np-gambel-oak','np-mountain-mahogany','np-big-sagebrush','np-blue-grama'])] },
    { name: 'Colorado Springs', usdaZone: '5b', lat: 38.83, lng: -104.82, plantIds: [...MTN_TREES, ...MTN_SHRUBS, ...MTN_GROUND],
      themes: [woodland(['np-ponderosa-pine','np-gambel-oak','np-western-serviceberry','np-kinnikinnick']),
               poll(['np-rabbitbrush','np-penstemon-strictus','np-blanket-flower','np-indian-paintbrush']),
               drought(['np-pinon-pine','np-rocky-mtn-juniper','np-big-sagebrush','np-blue-grama'])] },
    { name: 'Fort Collins', usdaZone: '5a', lat: 40.59, lng: -105.08, plantIds: [...MTN_TREES, ...MTN_SHRUBS, ...MTN_GROUND, 'np-bur-oak','np-hackberry','np-switchgrass'],
      themes: [prairie(['np-little-bluestem','np-switchgrass','np-prairie-smoke','np-yarrow','np-blue-flax']),
               poll(['np-rabbitbrush','np-penstemon-strictus','np-blanket-flower','np-sulphur-buckwheat']),
               drought(['np-rocky-mtn-juniper','np-hackberry','np-mountain-mahogany','np-blue-grama'])] },
  ]},

  // ─── CONNECTICUT ───
  { code: 'CT', name: 'Connecticut', cities: [
    { name: 'Hartford', usdaZone: '6b', lat: 41.76, lng: -72.68, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND],
      themes: [shade(['np-american-beech','np-spicebush','np-witch-hazel','np-christmas-fern','np-foamflower','np-solomon-seal']),
               poll(['np-summersweet','np-winterberry','np-mountain-laurel','np-columbine','np-joe-pye-weed','np-bee-balm']),
               rain(['np-red-maple','np-winterberry','np-inkberry','np-summersweet','np-joe-pye-weed'])] },
    { name: 'New Haven', usdaZone: '7a', lat: 41.31, lng: -72.92, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND],
      themes: [shade(['np-american-beech','np-spicebush','np-witch-hazel','np-christmas-fern','np-wild-ginger']),
               poll(['np-summersweet','np-winterberry','np-columbine','np-joe-pye-weed','np-new-england-aster']),
               rain(['np-red-maple','np-winterberry','np-inkberry','np-summersweet'])] },
    { name: 'Stamford', usdaZone: '7a', lat: 41.05, lng: -73.54, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-bayberry'],
      themes: [shade(['np-american-beech','np-spicebush','np-christmas-fern','np-foamflower','np-solomon-seal']),
               poll(['np-summersweet','np-winterberry','np-columbine','np-joe-pye-weed','np-bee-balm']),
               rain(['np-red-maple','np-winterberry','np-inkberry','np-summersweet'])] },
  ]},

  // ─── DELAWARE ───
  { code: 'DE', name: 'Delaware', cities: [
    { name: 'Wilmington', usdaZone: '7a', lat: 39.74, lng: -75.55, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-river-birch','np-sweetgum'],
      themes: [shade(['np-american-beech','np-eastern-redbud','np-spicebush','np-christmas-fern','np-wild-ginger']),
               poll(['np-summersweet','np-winterberry','np-columbine','np-joe-pye-weed','np-bee-balm']),
               rain(['np-river-birch','np-sweetgum','np-winterberry','np-inkberry','np-joe-pye-weed'])] },
    { name: 'Dover', usdaZone: '7a', lat: 39.16, lng: -75.52, plantIds: [...NE_TREES.slice(0,8), ...NE_SHRUBS, ...NE_GROUND, 'np-river-birch','np-loblolly-pine','np-bald-cypress'],
      themes: [shade(['np-eastern-redbud','np-spicebush','np-christmas-fern','np-foamflower']),
               poll(['np-summersweet','np-winterberry','np-joe-pye-weed','np-butterfly-milkweed']),
               rain(['np-bald-cypress','np-river-birch','np-winterberry','np-inkberry'])] },
    { name: 'Newark', usdaZone: '7a', lat: 39.68, lng: -75.75, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND],
      themes: [shade(['np-american-beech','np-spicebush','np-witch-hazel','np-christmas-fern','np-wild-ginger']),
               poll(['np-summersweet','np-winterberry','np-columbine','np-joe-pye-weed']),
               woodland(['np-white-oak','np-american-beech','np-sassafras','np-mountain-laurel','np-solomon-seal'])] },
  ]},

  // ─── FLORIDA ───
  { code: 'FL', name: 'Florida', cities: [
    { name: 'Miami', usdaZone: '10b', lat: 25.76, lng: -80.19, plantIds: [...FL_TREES, ...FL_SHRUBS, ...FL_GROUND, 'np-royal-palm','np-geiger-tree'],
      themes: [tropical(['np-gumbo-limbo','np-mahogany','np-royal-palm','np-firebush','np-wild-coffee']),
               poll(['np-firebush','np-beach-sunflower','np-sunshine-mimosa','np-lantana-native']),
               drought(['np-sabal-palm','np-saw-palmetto','np-coontie','np-sea-grape','np-beach-sunflower'])] },
    { name: 'Orlando', usdaZone: '9b', lat: 28.54, lng: -81.38, plantIds: [...FL_TREES, ...FL_SHRUBS, ...FL_GROUND, 'np-crape-myrtle'],
      themes: [shade(['np-southern-magnolia','np-sweetbay-magnolia','np-coontie','np-wild-coffee']),
               poll(['np-firebush','np-beautyberry','np-lantana-native','np-sunshine-mimosa']),
               rain(['np-bald-cypress','np-dahoon-holly','np-blue-flag-iris','np-muhly-grass'])] },
    { name: 'Jacksonville', usdaZone: '9a', lat: 30.33, lng: -81.66, plantIds: [...FL_TREES, ...FL_SHRUBS, ...FL_GROUND, 'np-crape-myrtle','np-eastern-redbud','np-yaupon-holly','np-virginia-sweetspire'],
      themes: [shade(['np-southern-magnolia','np-sweetbay-magnolia','np-wild-coffee','np-virginia-sweetspire']),
               poll(['np-firebush','np-beautyberry','np-coral-honeysuckle','np-lantana-native']),
               rain(['np-bald-cypress','np-dahoon-holly','np-virginia-sweetspire','np-muhly-grass'])] },
  ]},

  // ─── GEORGIA ───
  { code: 'GA', name: 'Georgia', cities: [
    { name: 'Atlanta', usdaZone: '7b', lat: 33.75, lng: -84.39, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, 'np-white-oak','np-mountain-laurel'],
      themes: [shade(['np-eastern-redbud','np-azalea-native','np-fothergilla','np-foamflower','np-christmas-fern','np-woodland-phlox']),
               poll(['np-beautyberry','np-virginia-sweetspire','np-coral-honeysuckle','np-purple-coneflower']),
               drought(['np-live-oak','np-yaupon-holly','np-crape-myrtle','np-muhly-grass'])] },
    { name: 'Savannah', usdaZone: '8b', lat: 32.08, lng: -81.09, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, 'np-sabal-palm','np-saw-palmetto','np-dwarf-palmetto'],
      themes: [shade(['np-southern-magnolia','np-sweetbay-magnolia','np-dwarf-palmetto','np-virginia-sweetspire']),
               poll(['np-beautyberry','np-coral-honeysuckle','np-lantana-native','np-black-eyed-susan']),
               rain(['np-bald-cypress','np-sweetgum','np-virginia-sweetspire','np-muhly-grass'])] },
    { name: 'Augusta', usdaZone: '8a', lat: 33.47, lng: -81.97, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND],
      themes: [shade(['np-eastern-redbud','np-azalea-native','np-fothergilla','np-christmas-fern','np-foamflower']),
               poll(['np-beautyberry','np-virginia-sweetspire','np-purple-coneflower','np-coral-honeysuckle']),
               drought(['np-live-oak','np-longleaf-pine','np-yaupon-holly','np-muhly-grass'])] },
  ]},

  // ─── HAWAII ───
  { code: 'HI', name: 'Hawaii', cities: [
    { name: 'Honolulu', usdaZone: '11b', lat: 21.31, lng: -157.86,
      plantIds: ['np-ohia-lehua','np-koa','np-naupaka','np-ilima','np-ti-plant','np-pili-grass','np-sabal-palm'],
      themes: [tropical(['np-koa','np-ohia-lehua','np-ti-plant','np-naupaka']),
               drought(['np-naupaka','np-ilima','np-pili-grass']),
               poll(['np-ohia-lehua','np-ilima','np-ti-plant'])] },
    { name: 'Hilo', usdaZone: '11a', lat: 19.73, lng: -155.09,
      plantIds: ['np-ohia-lehua','np-koa','np-naupaka','np-ilima','np-ti-plant','np-pili-grass'],
      themes: [tropical(['np-koa','np-ohia-lehua','np-ti-plant']),
               rain(['np-ohia-lehua','np-koa','np-ti-plant']),
               poll(['np-ohia-lehua','np-ilima'])] },
    { name: 'Kailua-Kona', usdaZone: '11b', lat: 19.64, lng: -155.99,
      plantIds: ['np-ohia-lehua','np-koa','np-naupaka','np-ilima','np-ti-plant','np-pili-grass'],
      themes: [drought(['np-naupaka','np-ilima','np-pili-grass']),
               tropical(['np-koa','np-ohia-lehua','np-ti-plant']),
               poll(['np-ohia-lehua','np-ilima'])] },
  ]},

  // ─── IDAHO ───
  { code: 'ID', name: 'Idaho', cities: [
    { name: 'Boise', usdaZone: '6b', lat: 43.62, lng: -116.21, plantIds: [...MTN_TREES, ...MTN_SHRUBS, ...MTN_GROUND, 'np-hackberry'],
      themes: [drought(['np-rocky-mtn-juniper','np-big-sagebrush','np-rabbitbrush','np-blue-grama','np-blanket-flower']),
               poll(['np-rabbitbrush','np-penstemon-strictus','np-blanket-flower','np-indian-paintbrush']),
               woodland(['np-ponderosa-pine','np-quaking-aspen','np-western-serviceberry','np-kinnikinnick'])] },
    { name: 'Idaho Falls', usdaZone: '5a', lat: 43.49, lng: -112.03, plantIds: [...MTN_TREES, ...MTN_SHRUBS, ...MTN_GROUND],
      themes: [drought(['np-rocky-mtn-juniper','np-big-sagebrush','np-rabbitbrush','np-blue-flax']),
               poll(['np-rabbitbrush','np-penstemon-strictus','np-blanket-flower']),
               prairie(['np-little-bluestem','np-prairie-smoke','np-yarrow','np-blue-flax'])] },
    { name: 'Coeur d\'Alene', usdaZone: '6a', lat: 47.68, lng: -116.78, plantIds: [...PNW_TREES, ...PNW_SHRUBS, ...PNW_GROUND, ...MTN_TREES.slice(0,4)],
      themes: [woodland(['np-douglas-fir','np-western-red-cedar','np-vine-maple','np-oregon-grape','np-sword-fern']),
               poll(['np-red-flowering-currant','np-oceanspray','np-douglas-aster','np-fireweed']),
               shade(['np-western-red-cedar','np-salal','np-sword-fern','np-deer-fern','np-bunchberry'])] },
  ]},

  // ─── ILLINOIS ───
  { code: 'IL', name: 'Illinois', cities: [
    { name: 'Chicago', usdaZone: '5b', lat: 41.88, lng: -87.63, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-prairie-dropseed','np-purple-coneflower','np-blazing-star','np-wild-bergamot']),
               poll(['np-elderberry','np-buttonbush','np-purple-coneflower','np-bee-balm','np-butterfly-milkweed']),
               rain(['np-red-maple','np-buttonbush','np-red-osier-dogwood','np-switchgrass','np-joe-pye-weed'])] },
    { name: 'Springfield', usdaZone: '5b', lat: 39.78, lng: -89.65, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-switchgrass','np-purple-coneflower','np-blazing-star']),
               poll(['np-ninebark','np-elderberry','np-purple-coneflower','np-butterfly-milkweed','np-wild-bergamot']),
               shade(['np-ironwood','np-american-linden','np-spicebush','np-solomon-seal','np-wild-ginger'])] },
    { name: 'Peoria', usdaZone: '5b', lat: 40.69, lng: -89.59, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-prairie-dropseed','np-blazing-star','np-wild-bergamot']),
               poll(['np-elderberry','np-purple-coneflower','np-butterfly-milkweed','np-goldenrod']),
               rain(['np-buttonbush','np-red-osier-dogwood','np-switchgrass','np-joe-pye-weed'])] },
  ]},

  // ─── INDIANA ───
  { code: 'IN', name: 'Indiana', cities: [
    { name: 'Indianapolis', usdaZone: '5b', lat: 39.77, lng: -86.16, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND, ...NE_TREES.slice(0,4)],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-purple-coneflower','np-blazing-star','np-wild-bergamot']),
               poll(['np-ninebark','np-elderberry','np-purple-coneflower','np-butterfly-milkweed','np-bee-balm']),
               shade(['np-ironwood','np-serviceberry','np-spicebush','np-solomon-seal','np-wild-ginger'])] },
    { name: 'Fort Wayne', usdaZone: '5b', lat: 41.08, lng: -85.14, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-switchgrass','np-purple-coneflower','np-blazing-star']),
               poll(['np-elderberry','np-butterfly-milkweed','np-wild-bergamot','np-goldenrod']),
               rain(['np-buttonbush','np-red-osier-dogwood','np-switchgrass','np-joe-pye-weed'])] },
    { name: 'Evansville', usdaZone: '6b', lat: 37.97, lng: -87.56, plantIds: [...MW_TREES, ...SE_TREES.slice(0,5), ...MW_SHRUBS, ...MW_GROUND],
      themes: [shade(['np-eastern-redbud','np-ironwood','np-serviceberry','np-christmas-fern','np-solomon-seal']),
               poll(['np-elderberry','np-purple-coneflower','np-butterfly-milkweed','np-blazing-star']),
               rain(['np-bald-cypress','np-buttonbush','np-red-osier-dogwood','np-switchgrass'])] },
  ]},

  // ─── IOWA ───
  { code: 'IA', name: 'Iowa', cities: [
    { name: 'Des Moines', usdaZone: '5a', lat: 41.59, lng: -93.62, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-prairie-dropseed','np-purple-coneflower','np-blazing-star','np-wild-bergamot']),
               poll(['np-ninebark','np-elderberry','np-purple-coneflower','np-butterfly-milkweed']),
               drought(['np-bur-oak','np-hackberry','np-little-bluestem','np-prairie-dropseed'])] },
    { name: 'Cedar Rapids', usdaZone: '5a', lat: 42.00, lng: -91.64, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND],
      themes: [prairie(['np-big-bluestem','np-switchgrass','np-purple-coneflower','np-blazing-star','np-prairie-dropseed']),
               poll(['np-elderberry','np-butterfly-milkweed','np-wild-bergamot','np-goldenrod']),
               rain(['np-buttonbush','np-red-osier-dogwood','np-switchgrass','np-joe-pye-weed'])] },
    { name: 'Davenport', usdaZone: '5b', lat: 41.52, lng: -90.58, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-purple-coneflower','np-wild-bergamot','np-blazing-star']),
               poll(['np-ninebark','np-elderberry','np-butterfly-milkweed','np-goldenrod']),
               shade(['np-ironwood','np-serviceberry','np-christmas-fern','np-solomon-seal'])] },
  ]},

  // ─── KANSAS ───
  { code: 'KS', name: 'Kansas', cities: [
    { name: 'Wichita', usdaZone: '6b', lat: 37.69, lng: -97.34, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND, 'np-eastern-red-cedar'],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-sideoats-grama','np-switchgrass','np-purple-coneflower','np-blazing-star']),
               drought(['np-bur-oak','np-hackberry','np-eastern-red-cedar','np-little-bluestem','np-buffalo-grass']),
               poll(['np-leadplant','np-purple-coneflower','np-butterfly-milkweed','np-wild-bergamot'])] },
    { name: 'Kansas City', usdaZone: '6a', lat: 39.10, lng: -94.58, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-switchgrass','np-purple-coneflower','np-blazing-star']),
               poll(['np-ninebark','np-elderberry','np-butterfly-milkweed','np-wild-bergamot']),
               rain(['np-buttonbush','np-red-osier-dogwood','np-switchgrass','np-joe-pye-weed'])] },
    { name: 'Topeka', usdaZone: '6a', lat: 39.05, lng: -95.68, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-prairie-dropseed','np-purple-coneflower','np-blazing-star']),
               drought(['np-bur-oak','np-hackberry','np-eastern-red-cedar','np-leadplant','np-little-bluestem']),
               poll(['np-elderberry','np-butterfly-milkweed','np-wild-bergamot','np-goldenrod'])] },
  ]},

  // ─── KENTUCKY ───
  { code: 'KY', name: 'Kentucky', cities: [
    { name: 'Louisville', usdaZone: '6b', lat: 38.25, lng: -85.76, plantIds: [...MW_TREES, ...SE_TREES.slice(0,6), ...MW_SHRUBS, ...MW_GROUND, ...SE_GROUND.slice(0,4)],
      themes: [shade(['np-eastern-redbud','np-ironwood','np-spicebush','np-christmas-fern','np-solomon-seal']),
               poll(['np-elderberry','np-purple-coneflower','np-butterfly-milkweed','np-bee-balm']),
               rain(['np-bald-cypress','np-buttonbush','np-red-osier-dogwood','np-switchgrass'])] },
    { name: 'Lexington', usdaZone: '6b', lat: 38.04, lng: -84.50, plantIds: [...MW_TREES, ...SE_TREES.slice(0,6), ...MW_SHRUBS, ...MW_GROUND, 'np-pawpaw'],
      themes: [woodland(['np-white-oak','np-tulip-poplar','np-pawpaw','np-serviceberry','np-spicebush','np-christmas-fern']),
               poll(['np-elderberry','np-purple-coneflower','np-bee-balm','np-butterfly-milkweed']),
               shade(['np-ironwood','np-pawpaw','np-spicebush','np-christmas-fern','np-wild-ginger'])] },
    { name: 'Bowling Green', usdaZone: '6b', lat: 36.99, lng: -86.44, plantIds: [...MW_TREES.slice(0,6), ...SE_TREES.slice(0,8), ...MW_SHRUBS, ...MW_GROUND],
      themes: [shade(['np-eastern-redbud','np-ironwood','np-spicebush','np-christmas-fern']),
               prairie(['np-big-bluestem','np-little-bluestem','np-purple-coneflower','np-blazing-star']),
               poll(['np-elderberry','np-butterfly-milkweed','np-wild-bergamot'])] },
  ]},

  // ─── LOUISIANA ───
  { code: 'LA', name: 'Louisiana', cities: [
    { name: 'New Orleans', usdaZone: '9a', lat: 29.95, lng: -90.07, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, ...FL_SHRUBS.slice(0,4), 'np-sabal-palm','np-saw-palmetto'],
      themes: [shade(['np-southern-magnolia','np-sweetbay-magnolia','np-saw-palmetto','np-christmas-fern']),
               poll(['np-beautyberry','np-firebush','np-coral-honeysuckle','np-lantana-native']),
               rain(['np-bald-cypress','np-sweetgum','np-virginia-sweetspire','np-blue-flag-iris'])] },
    { name: 'Baton Rouge', usdaZone: '8b', lat: 30.45, lng: -91.19, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, 'np-sabal-palm'],
      themes: [shade(['np-southern-magnolia','np-sweetbay-magnolia','np-oakleaf-hydrangea','np-christmas-fern']),
               poll(['np-beautyberry','np-virginia-sweetspire','np-coral-honeysuckle','np-purple-coneflower']),
               rain(['np-bald-cypress','np-sweetgum','np-red-maple','np-blue-flag-iris'])] },
    { name: 'Shreveport', usdaZone: '8a', lat: 32.53, lng: -93.75, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, ...TX_GROUND.slice(0,3)],
      themes: [shade(['np-eastern-redbud','np-azalea-native','np-spicebush','np-christmas-fern']),
               poll(['np-beautyberry','np-purple-coneflower','np-black-eyed-susan','np-coral-honeysuckle']),
               drought(['np-live-oak','np-yaupon-holly','np-crape-myrtle','np-muhly-grass'])] },
  ]},

  // ─── MAINE ───
  { code: 'ME', name: 'Maine', cities: [
    { name: 'Portland', usdaZone: '5b', lat: 43.66, lng: -70.26, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-paper-birch','np-eastern-white-cedar'],
      themes: [shade(['np-eastern-hemlock','np-american-beech','np-witch-hazel','np-christmas-fern','np-wild-ginger']),
               poll(['np-summersweet','np-winterberry','np-bee-balm','np-joe-pye-weed','np-new-england-aster']),
               rain(['np-red-maple','np-winterberry','np-inkberry','np-summersweet'])] },
    { name: 'Bangor', usdaZone: '4b', lat: 44.80, lng: -68.77, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-paper-birch','np-eastern-white-cedar'],
      themes: [woodland(['np-white-pine','np-sugar-maple','np-american-beech','np-paper-birch','np-christmas-fern']),
               poll(['np-summersweet','np-winterberry','np-bee-balm','np-joe-pye-weed']),
               shade(['np-eastern-hemlock','np-witch-hazel','np-christmas-fern','np-wild-ginger'])] },
    { name: 'Augusta', usdaZone: '5a', lat: 44.31, lng: -69.78, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-paper-birch'],
      themes: [shade(['np-eastern-hemlock','np-american-beech','np-christmas-fern','np-wild-ginger','np-solomon-seal']),
               poll(['np-summersweet','np-elderberry','np-bee-balm','np-joe-pye-weed']),
               rain(['np-red-maple','np-winterberry','np-summersweet','np-joe-pye-weed'])] },
  ]},

  // ─── MARYLAND ───
  { code: 'MD', name: 'Maryland', cities: [
    { name: 'Baltimore', usdaZone: '7a', lat: 39.29, lng: -76.61, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-river-birch','np-sweetgum','np-eastern-redbud'],
      themes: [shade(['np-american-beech','np-eastern-redbud','np-spicebush','np-christmas-fern','np-foamflower']),
               poll(['np-summersweet','np-winterberry','np-joe-pye-weed','np-bee-balm','np-columbine']),
               rain(['np-river-birch','np-sweetgum','np-winterberry','np-inkberry','np-joe-pye-weed'])] },
    { name: 'Annapolis', usdaZone: '7b', lat: 38.98, lng: -76.49, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-river-birch','np-sweetgum','np-bayberry'],
      themes: [shade(['np-american-beech','np-spicebush','np-witch-hazel','np-christmas-fern']),
               poll(['np-summersweet','np-winterberry','np-joe-pye-weed','np-bee-balm']),
               rain(['np-river-birch','np-winterberry','np-inkberry','np-summersweet'])] },
    { name: 'Frederick', usdaZone: '7a', lat: 39.41, lng: -77.41, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-eastern-redbud','np-pawpaw'],
      themes: [woodland(['np-white-oak','np-tulip-poplar','np-pawpaw','np-mountain-laurel','np-spicebush','np-christmas-fern']),
               poll(['np-summersweet','np-elderberry','np-bee-balm','np-joe-pye-weed','np-columbine']),
               shade(['np-eastern-redbud','np-pawpaw','np-spicebush','np-wild-ginger','np-solomon-seal'])] },
  ]},

  // ─── MASSACHUSETTS ───
  { code: 'MA', name: 'Massachusetts', cities: [
    { name: 'Boston', usdaZone: '6b', lat: 42.36, lng: -71.06, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-bayberry'],
      themes: [shade(['np-american-beech','np-witch-hazel','np-spicebush','np-christmas-fern','np-foamflower']),
               poll(['np-summersweet','np-winterberry','np-bee-balm','np-joe-pye-weed','np-new-england-aster']),
               rain(['np-red-maple','np-winterberry','np-inkberry','np-summersweet'])] },
    { name: 'Worcester', usdaZone: '6a', lat: 42.26, lng: -71.80, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND],
      themes: [woodland(['np-white-pine','np-sugar-maple','np-white-oak','np-mountain-laurel','np-christmas-fern']),
               poll(['np-summersweet','np-elderberry','np-bee-balm','np-joe-pye-weed']),
               shade(['np-eastern-hemlock','np-american-beech','np-witch-hazel','np-christmas-fern'])] },
    { name: 'Springfield', usdaZone: '6a', lat: 42.10, lng: -72.59, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND],
      themes: [shade(['np-american-beech','np-spicebush','np-witch-hazel','np-christmas-fern','np-wild-ginger']),
               poll(['np-summersweet','np-winterberry','np-columbine','np-bee-balm','np-butterfly-milkweed']),
               rain(['np-red-maple','np-winterberry','np-inkberry','np-summersweet'])] },
  ]},

  // ─── MICHIGAN ───
  { code: 'MI', name: 'Michigan', cities: [
    { name: 'Detroit', usdaZone: '6a', lat: 42.33, lng: -83.05, plantIds: [...MW_TREES, ...NE_TREES.slice(0,6), ...MW_SHRUBS, ...MW_GROUND, ...NE_GROUND.slice(0,5)],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-prairie-dropseed','np-purple-coneflower','np-blazing-star']),
               poll(['np-ninebark','np-elderberry','np-butterfly-milkweed','np-bee-balm','np-new-england-aster']),
               shade(['np-sugar-maple','np-ironwood','np-serviceberry','np-christmas-fern','np-wild-ginger'])] },
    { name: 'Grand Rapids', usdaZone: '5b', lat: 42.96, lng: -85.66, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND, 'np-paper-birch'],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-switchgrass','np-purple-coneflower','np-wild-bergamot']),
               poll(['np-elderberry','np-butterfly-milkweed','np-bee-balm','np-goldenrod']),
               rain(['np-buttonbush','np-red-osier-dogwood','np-switchgrass','np-joe-pye-weed'])] },
    { name: 'Traverse City', usdaZone: '5a', lat: 44.76, lng: -85.62, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND, 'np-paper-birch','np-eastern-white-cedar'],
      themes: [woodland(['np-paper-birch','np-sugar-maple','np-white-pine','np-serviceberry','np-christmas-fern']),
               poll(['np-elderberry','np-butterfly-milkweed','np-wild-bergamot','np-goldenrod']),
               shade(['np-ironwood','np-eastern-hemlock','np-christmas-fern','np-wild-ginger'])] },
  ]},

  // ─── MINNESOTA ───
  { code: 'MN', name: 'Minnesota', cities: [
    { name: 'Minneapolis', usdaZone: '4b', lat: 44.98, lng: -93.27, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND, 'np-paper-birch','np-quaking-aspen'],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-prairie-dropseed','np-purple-coneflower','np-blazing-star','np-wild-bergamot']),
               poll(['np-ninebark','np-elderberry','np-butterfly-milkweed','np-bee-balm']),
               rain(['np-buttonbush','np-red-osier-dogwood','np-switchgrass','np-joe-pye-weed'])] },
    { name: 'St. Paul', usdaZone: '4b', lat: 44.94, lng: -93.09, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND, 'np-paper-birch'],
      themes: [prairie(['np-big-bluestem','np-prairie-dropseed','np-purple-coneflower','np-blazing-star']),
               poll(['np-elderberry','np-butterfly-milkweed','np-wild-bergamot','np-goldenrod']),
               shade(['np-ironwood','np-serviceberry','np-christmas-fern','np-wild-ginger'])] },
    { name: 'Duluth', usdaZone: '3b', lat: 46.79, lng: -92.10, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND, 'np-paper-birch','np-quaking-aspen','np-white-pine'],
      themes: [woodland(['np-paper-birch','np-quaking-aspen','np-white-pine','np-serviceberry','np-bunchberry']),
               poll(['np-elderberry','np-butterfly-milkweed','np-wild-bergamot','np-fireweed']),
               rain(['np-red-osier-dogwood','np-buttonbush','np-switchgrass'])] },
  ]},

  // ─── MISSISSIPPI ───
  { code: 'MS', name: 'Mississippi', cities: [
    { name: 'Jackson', usdaZone: '8a', lat: 32.30, lng: -90.18, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND],
      themes: [shade(['np-southern-magnolia','np-eastern-redbud','np-azalea-native','np-foamflower','np-christmas-fern']),
               poll(['np-beautyberry','np-virginia-sweetspire','np-coral-honeysuckle','np-purple-coneflower']),
               drought(['np-live-oak','np-yaupon-holly','np-crape-myrtle','np-muhly-grass'])] },
    { name: 'Gulfport', usdaZone: '8b', lat: 30.37, lng: -89.09, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, 'np-sabal-palm','np-saw-palmetto'],
      themes: [shade(['np-southern-magnolia','np-sweetbay-magnolia','np-saw-palmetto','np-christmas-fern']),
               poll(['np-beautyberry','np-firebush','np-lantana-native','np-coral-honeysuckle']),
               rain(['np-bald-cypress','np-sweetgum','np-virginia-sweetspire','np-blue-flag-iris'])] },
    { name: 'Hattiesburg', usdaZone: '8a', lat: 31.33, lng: -89.29, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, 'np-longleaf-pine'],
      themes: [shade(['np-eastern-redbud','np-azalea-native','np-sweetbay-magnolia','np-christmas-fern']),
               poll(['np-beautyberry','np-virginia-sweetspire','np-purple-coneflower','np-coral-honeysuckle']),
               drought(['np-longleaf-pine','np-live-oak','np-yaupon-holly','np-muhly-grass'])] },
  ]},

  // ─── MISSOURI ───
  { code: 'MO', name: 'Missouri', cities: [
    { name: 'Kansas City', usdaZone: '6a', lat: 39.10, lng: -94.58, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND, ...SE_TREES.slice(0,4)],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-switchgrass','np-purple-coneflower','np-blazing-star']),
               poll(['np-ninebark','np-elderberry','np-butterfly-milkweed','np-wild-bergamot']),
               shade(['np-ironwood','np-eastern-redbud','np-spicebush','np-christmas-fern'])] },
    { name: 'St. Louis', usdaZone: '6b', lat: 38.63, lng: -90.20, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND, ...SE_TREES.slice(0,5)],
      themes: [shade(['np-eastern-redbud','np-ironwood','np-spicebush','np-christmas-fern','np-solomon-seal']),
               prairie(['np-big-bluestem','np-little-bluestem','np-prairie-dropseed','np-purple-coneflower']),
               poll(['np-elderberry','np-butterfly-milkweed','np-bee-balm','np-wild-bergamot'])] },
    { name: 'Springfield', usdaZone: '6b', lat: 37.22, lng: -93.29, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND, 'np-eastern-red-cedar'],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-switchgrass','np-purple-coneflower','np-blazing-star']),
               drought(['np-bur-oak','np-hackberry','np-eastern-red-cedar','np-little-bluestem']),
               poll(['np-elderberry','np-butterfly-milkweed','np-wild-bergamot','np-goldenrod'])] },
  ]},

  // ─── MONTANA ───
  { code: 'MT', name: 'Montana', cities: [
    { name: 'Billings', usdaZone: '4b', lat: 45.78, lng: -108.50, plantIds: [...MTN_TREES, ...MTN_SHRUBS, ...MTN_GROUND],
      themes: [drought(['np-rocky-mtn-juniper','np-big-sagebrush','np-rabbitbrush','np-blue-grama']),
               prairie(['np-little-bluestem','np-prairie-smoke','np-yarrow','np-blue-flax','np-blanket-flower']),
               poll(['np-rabbitbrush','np-penstemon-strictus','np-blanket-flower','np-indian-paintbrush'])] },
    { name: 'Missoula', usdaZone: '5b', lat: 46.87, lng: -114.00, plantIds: [...MTN_TREES, ...PNW_TREES.slice(0,4), ...MTN_SHRUBS, ...PNW_SHRUBS.slice(0,4), ...MTN_GROUND],
      themes: [woodland(['np-ponderosa-pine','np-douglas-fir','np-quaking-aspen','np-western-serviceberry','np-kinnikinnick']),
               poll(['np-rabbitbrush','np-red-flowering-currant','np-blanket-flower','np-fireweed']),
               drought(['np-rocky-mtn-juniper','np-big-sagebrush','np-rabbitbrush','np-blue-grama'])] },
    { name: 'Great Falls', usdaZone: '4a', lat: 47.51, lng: -111.28, plantIds: [...MTN_TREES, ...MTN_SHRUBS, ...MTN_GROUND],
      themes: [prairie(['np-little-bluestem','np-prairie-smoke','np-blanket-flower','np-yarrow','np-blue-flax']),
               drought(['np-rocky-mtn-juniper','np-big-sagebrush','np-rabbitbrush','np-blue-grama']),
               poll(['np-rabbitbrush','np-penstemon-strictus','np-blanket-flower'])] },
  ]},

  // ─── NEBRASKA ───
  { code: 'NE', name: 'Nebraska', cities: [
    { name: 'Omaha', usdaZone: '5a', lat: 41.26, lng: -95.94, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND, 'np-eastern-red-cedar'],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-switchgrass','np-purple-coneflower','np-blazing-star']),
               drought(['np-bur-oak','np-hackberry','np-eastern-red-cedar','np-little-bluestem','np-sideoats-grama']),
               poll(['np-ninebark','np-elderberry','np-butterfly-milkweed','np-wild-bergamot'])] },
    { name: 'Lincoln', usdaZone: '5a', lat: 40.81, lng: -96.70, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-prairie-dropseed','np-purple-coneflower','np-blazing-star']),
               drought(['np-bur-oak','np-hackberry','np-leadplant','np-little-bluestem','np-buffalo-grass']),
               poll(['np-elderberry','np-butterfly-milkweed','np-wild-bergamot','np-goldenrod'])] },
    { name: 'Grand Island', usdaZone: '5a', lat: 40.93, lng: -98.34, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND],
      themes: [prairie(['np-big-bluestem','np-switchgrass','np-sideoats-grama','np-purple-coneflower','np-blazing-star']),
               drought(['np-bur-oak','np-hackberry','np-eastern-red-cedar','np-buffalo-grass','np-blue-grama']),
               poll(['np-elderberry','np-butterfly-milkweed','np-wild-bergamot'])] },
  ]},

  // ─── NEVADA ───
  { code: 'NV', name: 'Nevada', cities: [
    { name: 'Las Vegas', usdaZone: '9a', lat: 36.17, lng: -115.14, plantIds: [...SW_TREES, ...SW_SHRUBS, ...SW_GROUND],
      themes: [desert(['np-palo-verde','np-agave-americana','np-red-yucca','np-desert-spoon','np-desert-marigold']),
               drought(['np-mesquite','np-ironwood-desert','np-jojoba','np-creosote','np-agave-parryi']),
               poll(['np-chuparosa','np-desert-willow','np-globe-mallow','np-autumn-sage'])] },
    { name: 'Reno', usdaZone: '6b', lat: 39.53, lng: -119.81, plantIds: [...MTN_TREES, ...MTN_SHRUBS, ...MTN_GROUND, 'np-big-sagebrush'],
      themes: [drought(['np-pinon-pine','np-rocky-mtn-juniper','np-big-sagebrush','np-rabbitbrush','np-blue-grama']),
               poll(['np-rabbitbrush','np-penstemon-strictus','np-blanket-flower']),
               woodland(['np-ponderosa-pine','np-quaking-aspen','np-western-serviceberry','np-kinnikinnick'])] },
    { name: 'Henderson', usdaZone: '9a', lat: 36.04, lng: -114.98, plantIds: [...SW_TREES, ...SW_SHRUBS, ...SW_GROUND],
      themes: [desert(['np-palo-verde','np-agave-americana','np-red-yucca','np-ocotillo','np-desert-marigold']),
               drought(['np-mesquite','np-ironwood-desert','np-creosote','np-jojoba']),
               poll(['np-chuparosa','np-globe-mallow','np-autumn-sage','np-desert-willow'])] },
  ]},

  // ─── NEW HAMPSHIRE ───
  { code: 'NH', name: 'New Hampshire', cities: [
    { name: 'Manchester', usdaZone: '5b', lat: 42.99, lng: -71.46, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-paper-birch'],
      themes: [shade(['np-eastern-hemlock','np-american-beech','np-witch-hazel','np-christmas-fern','np-wild-ginger']),
               poll(['np-summersweet','np-winterberry','np-bee-balm','np-joe-pye-weed','np-new-england-aster']),
               woodland(['np-sugar-maple','np-white-pine','np-paper-birch','np-mountain-laurel','np-christmas-fern'])] },
    { name: 'Concord', usdaZone: '5a', lat: 43.21, lng: -71.54, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-paper-birch'],
      themes: [woodland(['np-sugar-maple','np-white-pine','np-paper-birch','np-serviceberry','np-christmas-fern']),
               poll(['np-summersweet','np-winterberry','np-bee-balm','np-joe-pye-weed']),
               shade(['np-eastern-hemlock','np-witch-hazel','np-christmas-fern','np-wild-ginger'])] },
    { name: 'Nashua', usdaZone: '5b', lat: 42.77, lng: -71.47, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND],
      themes: [shade(['np-american-beech','np-witch-hazel','np-spicebush','np-christmas-fern','np-foamflower']),
               poll(['np-summersweet','np-winterberry','np-bee-balm','np-new-england-aster']),
               rain(['np-red-maple','np-winterberry','np-inkberry','np-summersweet'])] },
  ]},

  // ─── NEW JERSEY ───
  { code: 'NJ', name: 'New Jersey', cities: [
    { name: 'Newark', usdaZone: '7a', lat: 40.74, lng: -74.17, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-river-birch','np-sweetgum','np-bayberry'],
      themes: [shade(['np-american-beech','np-spicebush','np-witch-hazel','np-christmas-fern','np-foamflower']),
               poll(['np-summersweet','np-winterberry','np-bee-balm','np-joe-pye-weed','np-new-england-aster']),
               rain(['np-river-birch','np-sweetgum','np-winterberry','np-inkberry'])] },
    { name: 'Jersey City', usdaZone: '7a', lat: 40.73, lng: -74.08, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-bayberry'],
      themes: [shade(['np-american-beech','np-spicebush','np-christmas-fern','np-foamflower']),
               poll(['np-summersweet','np-winterberry','np-bee-balm','np-joe-pye-weed']),
               rain(['np-red-maple','np-winterberry','np-inkberry','np-joe-pye-weed'])] },
    { name: 'Trenton', usdaZone: '7a', lat: 40.22, lng: -74.76, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-sweetgum','np-eastern-redbud'],
      themes: [shade(['np-eastern-redbud','np-spicebush','np-witch-hazel','np-christmas-fern','np-wild-ginger']),
               poll(['np-summersweet','np-winterberry','np-columbine','np-joe-pye-weed','np-butterfly-milkweed']),
               woodland(['np-white-oak','np-tulip-poplar','np-sassafras','np-mountain-laurel','np-solomon-seal'])] },
  ]},

  // ─── NEW MEXICO ───
  { code: 'NM', name: 'New Mexico', cities: [
    { name: 'Albuquerque', usdaZone: '7a', lat: 35.08, lng: -106.65, plantIds: [...SW_TREES, ...SW_SHRUBS, ...SW_GROUND, 'np-new-mexico-olive'],
      themes: [desert(['np-palo-verde','np-agave-americana','np-red-yucca','np-desert-spoon','np-desert-marigold']),
               drought(['np-mesquite','np-desert-willow','np-apache-plume','np-fourwing-saltbush','np-blue-grama']),
               poll(['np-chuparosa','np-autumn-sage','np-globe-mallow','np-penstemon-superbus'])] },
    { name: 'Santa Fe', usdaZone: '5b', lat: 35.69, lng: -105.94, plantIds: [...MTN_TREES, ...SW_SHRUBS.slice(0,6), ...MTN_GROUND, ...SW_GROUND.slice(0,6)],
      themes: [woodland(['np-ponderosa-pine','np-pinon-pine','np-gambel-oak','np-western-serviceberry']),
               drought(['np-pinon-pine','np-rocky-mtn-juniper','np-apache-plume','np-big-sagebrush','np-blue-grama']),
               poll(['np-rabbitbrush','np-penstemon-strictus','np-blanket-flower','np-indian-paintbrush'])] },
    { name: 'Las Cruces', usdaZone: '8a', lat: 32.35, lng: -106.76, plantIds: [...SW_TREES, ...SW_SHRUBS, ...SW_GROUND],
      themes: [desert(['np-palo-verde','np-mesquite','np-agave-americana','np-red-yucca','np-ocotillo']),
               drought(['np-ironwood-desert','np-creosote','np-jojoba','np-fourwing-saltbush','np-blue-grama']),
               poll(['np-chuparosa','np-desert-willow','np-globe-mallow','np-autumn-sage'])] },
  ]},

  // ─── NEW YORK ───
  { code: 'NY', name: 'New York', cities: [
    { name: 'New York City', usdaZone: '7b', lat: 40.71, lng: -74.01, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-sweetgum','np-river-birch','np-bayberry'],
      themes: [shade(['np-american-beech','np-spicebush','np-witch-hazel','np-christmas-fern','np-foamflower']),
               poll(['np-summersweet','np-winterberry','np-bee-balm','np-joe-pye-weed','np-new-england-aster']),
               rain(['np-river-birch','np-sweetgum','np-winterberry','np-inkberry','np-joe-pye-weed'])] },
    { name: 'Buffalo', usdaZone: '6a', lat: 42.89, lng: -78.88, plantIds: [...NE_TREES, ...MW_TREES.slice(0,4), ...NE_SHRUBS, ...NE_GROUND, ...MW_GROUND.slice(0,5)],
      themes: [shade(['np-sugar-maple','np-american-beech','np-witch-hazel','np-christmas-fern','np-wild-ginger']),
               poll(['np-summersweet','np-winterberry','np-bee-balm','np-joe-pye-weed','np-butterfly-milkweed']),
               prairie(['np-big-bluestem','np-little-bluestem','np-purple-coneflower','np-blazing-star'])] },
    { name: 'Albany', usdaZone: '5b', lat: 42.65, lng: -73.76, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-paper-birch'],
      themes: [woodland(['np-sugar-maple','np-white-pine','np-paper-birch','np-serviceberry','np-christmas-fern']),
               poll(['np-summersweet','np-elderberry','np-bee-balm','np-joe-pye-weed']),
               shade(['np-eastern-hemlock','np-american-beech','np-christmas-fern','np-wild-ginger'])] },
  ]},

  // ─── NORTH CAROLINA ───
  { code: 'NC', name: 'North Carolina', cities: [
    { name: 'Charlotte', usdaZone: '7b', lat: 35.23, lng: -80.84, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, 'np-white-oak','np-mountain-laurel'],
      themes: [shade(['np-eastern-redbud','np-azalea-native','np-fothergilla','np-christmas-fern','np-foamflower']),
               poll(['np-beautyberry','np-virginia-sweetspire','np-purple-coneflower','np-coral-honeysuckle']),
               rain(['np-bald-cypress','np-sweetgum','np-red-maple','np-virginia-sweetspire'])] },
    { name: 'Raleigh', usdaZone: '7b', lat: 35.78, lng: -78.64, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, 'np-white-oak','np-flowering-dogwood'],
      themes: [shade(['np-flowering-dogwood','np-eastern-redbud','np-azalea-native','np-christmas-fern','np-foamflower']),
               poll(['np-beautyberry','np-virginia-sweetspire','np-coral-honeysuckle','np-purple-coneflower']),
               drought(['np-live-oak','np-yaupon-holly','np-crape-myrtle','np-muhly-grass'])] },
    { name: 'Asheville', usdaZone: '7a', lat: 35.60, lng: -82.55, plantIds: [...SE_TREES.slice(0,8), ...NE_TREES.slice(0,6), ...SE_SHRUBS, ...NE_SHRUBS.slice(0,5), ...SE_GROUND, ...NE_GROUND.slice(0,5)],
      themes: [woodland(['np-white-oak','np-tulip-poplar','np-sugar-maple','np-mountain-laurel','np-rhododendron','np-christmas-fern']),
               poll(['np-summersweet','np-bee-balm','np-joe-pye-weed','np-new-england-aster']),
               shade(['np-rhododendron','np-mountain-laurel','np-spicebush','np-christmas-fern','np-foamflower'])] },
  ]},

  // ─── NORTH DAKOTA ───
  { code: 'ND', name: 'North Dakota', cities: [
    { name: 'Fargo', usdaZone: '3b', lat: 46.88, lng: -96.79, plantIds: [...MW_TREES.slice(0,6), ...MW_SHRUBS, ...MW_GROUND, 'np-quaking-aspen','np-paper-birch'],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-switchgrass','np-purple-coneflower','np-blazing-star']),
               drought(['np-bur-oak','np-hackberry','np-leadplant','np-little-bluestem','np-buffalo-grass']),
               poll(['np-elderberry','np-butterfly-milkweed','np-wild-bergamot'])] },
    { name: 'Bismarck', usdaZone: '3b', lat: 46.81, lng: -100.78, plantIds: [...MW_TREES.slice(0,6), ...MW_SHRUBS, ...MW_GROUND, 'np-quaking-aspen'],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-sideoats-grama','np-purple-coneflower','np-blazing-star']),
               drought(['np-bur-oak','np-hackberry','np-eastern-red-cedar','np-buffalo-grass','np-blue-grama']),
               poll(['np-elderberry','np-butterfly-milkweed','np-wild-bergamot'])] },
    { name: 'Grand Forks', usdaZone: '3b', lat: 47.93, lng: -97.03, plantIds: [...MW_TREES.slice(0,6), ...MW_SHRUBS, ...MW_GROUND, 'np-paper-birch','np-quaking-aspen'],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-switchgrass','np-purple-coneflower']),
               drought(['np-bur-oak','np-hackberry','np-leadplant','np-buffalo-grass']),
               poll(['np-elderberry','np-butterfly-milkweed','np-wild-bergamot'])] },
  ]},

  // ─── OHIO ───
  { code: 'OH', name: 'Ohio', cities: [
    { name: 'Columbus', usdaZone: '6a', lat: 39.96, lng: -83.00, plantIds: [...MW_TREES, ...NE_TREES.slice(0,6), ...MW_SHRUBS, ...NE_SHRUBS.slice(0,5), ...MW_GROUND, ...NE_GROUND.slice(0,5)],
      themes: [shade(['np-sugar-maple','np-american-beech','np-ironwood','np-spicebush','np-christmas-fern','np-wild-ginger']),
               poll(['np-ninebark','np-elderberry','np-purple-coneflower','np-bee-balm','np-butterfly-milkweed']),
               prairie(['np-big-bluestem','np-little-bluestem','np-purple-coneflower','np-blazing-star','np-wild-bergamot'])] },
    { name: 'Cleveland', usdaZone: '6a', lat: 41.50, lng: -81.69, plantIds: [...MW_TREES, ...NE_TREES.slice(0,6), ...MW_SHRUBS, ...NE_SHRUBS.slice(0,5), ...MW_GROUND],
      themes: [shade(['np-sugar-maple','np-american-beech','np-witch-hazel','np-christmas-fern','np-wild-ginger']),
               poll(['np-summersweet','np-winterberry','np-bee-balm','np-joe-pye-weed']),
               rain(['np-red-maple','np-buttonbush','np-red-osier-dogwood','np-switchgrass'])] },
    { name: 'Cincinnati', usdaZone: '6b', lat: 39.10, lng: -84.51, plantIds: [...MW_TREES, ...SE_TREES.slice(0,4), ...MW_SHRUBS, ...MW_GROUND, 'np-pawpaw'],
      themes: [woodland(['np-white-oak','np-tulip-poplar','np-pawpaw','np-serviceberry','np-spicebush','np-christmas-fern']),
               poll(['np-elderberry','np-purple-coneflower','np-bee-balm','np-butterfly-milkweed']),
               shade(['np-ironwood','np-pawpaw','np-spicebush','np-christmas-fern','np-wild-ginger'])] },
  ]},

  // ─── OKLAHOMA ───
  { code: 'OK', name: 'Oklahoma', cities: [
    { name: 'Oklahoma City', usdaZone: '7a', lat: 35.47, lng: -97.52, plantIds: [...MW_TREES.slice(0,6), ...TX_TREES.slice(0,5), ...MW_SHRUBS, ...TX_SHRUBS, ...MW_GROUND, ...TX_GROUND.slice(0,4)],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-switchgrass','np-purple-coneflower','np-blazing-star']),
               drought(['np-bur-oak','np-hackberry','np-eastern-red-cedar','np-yaupon-holly','np-little-bluestem']),
               poll(['np-elderberry','np-butterfly-milkweed','np-wild-bergamot','np-autumn-sage'])] },
    { name: 'Tulsa', usdaZone: '7a', lat: 36.15, lng: -95.99, plantIds: [...MW_TREES, ...SE_TREES.slice(0,4), ...MW_SHRUBS, ...MW_GROUND],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-switchgrass','np-purple-coneflower','np-blazing-star']),
               poll(['np-elderberry','np-ninebark','np-butterfly-milkweed','np-wild-bergamot']),
               shade(['np-eastern-redbud','np-ironwood','np-serviceberry','np-christmas-fern'])] },
    { name: 'Norman', usdaZone: '7a', lat: 35.22, lng: -97.44, plantIds: [...MW_TREES.slice(0,6), ...TX_TREES.slice(0,5), ...MW_SHRUBS, ...MW_GROUND, ...TX_GROUND.slice(0,4)],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-sideoats-grama','np-purple-coneflower']),
               drought(['np-bur-oak','np-hackberry','np-eastern-red-cedar','np-yaupon-holly']),
               poll(['np-elderberry','np-butterfly-milkweed','np-autumn-sage'])] },
  ]},

  // ─── OREGON ───
  { code: 'OR', name: 'Oregon', cities: [
    { name: 'Portland', usdaZone: '8b', lat: 45.51, lng: -122.68, plantIds: [...PNW_TREES, ...PNW_SHRUBS, ...PNW_GROUND],
      themes: [shade(['np-western-red-cedar','np-vine-maple','np-salal','np-sword-fern','np-deer-fern','np-inside-out-flower']),
               poll(['np-red-flowering-currant','np-oceanspray','np-nootka-rose','np-douglas-aster']),
               rain(['np-vine-maple','np-red-osier-dogwood','np-tufted-hairgrass','np-sword-fern'])] },
    { name: 'Eugene', usdaZone: '8b', lat: 44.05, lng: -123.09, plantIds: [...PNW_TREES, ...PNW_SHRUBS, ...PNW_GROUND],
      themes: [shade(['np-western-red-cedar','np-vine-maple','np-salal','np-sword-fern','np-deer-fern']),
               poll(['np-red-flowering-currant','np-oceanspray','np-douglas-aster','np-fireweed']),
               woodland(['np-douglas-fir','np-oregon-white-oak','np-vine-maple','np-oregon-grape','np-sword-fern'])] },
    { name: 'Bend', usdaZone: '6a', lat: 44.06, lng: -121.31, plantIds: [...MTN_TREES, ...PNW_TREES.slice(0,3), ...MTN_SHRUBS, ...PNW_SHRUBS.slice(0,4), ...MTN_GROUND],
      themes: [drought(['np-ponderosa-pine','np-rocky-mtn-juniper','np-big-sagebrush','np-rabbitbrush','np-kinnikinnick']),
               poll(['np-rabbitbrush','np-penstemon-strictus','np-blanket-flower','np-fireweed']),
               woodland(['np-ponderosa-pine','np-quaking-aspen','np-western-serviceberry','np-oregon-grape'])] },
  ]},

  // ─── PENNSYLVANIA ───
  { code: 'PA', name: 'Pennsylvania', cities: [
    { name: 'Philadelphia', usdaZone: '7a', lat: 39.95, lng: -75.17, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-sweetgum','np-river-birch','np-eastern-redbud'],
      themes: [shade(['np-american-beech','np-eastern-redbud','np-spicebush','np-witch-hazel','np-christmas-fern','np-foamflower']),
               poll(['np-summersweet','np-winterberry','np-bee-balm','np-joe-pye-weed','np-columbine']),
               rain(['np-river-birch','np-sweetgum','np-winterberry','np-inkberry','np-joe-pye-weed'])] },
    { name: 'Pittsburgh', usdaZone: '6b', lat: 40.44, lng: -80.00, plantIds: [...NE_TREES, ...MW_TREES.slice(0,4), ...NE_SHRUBS, ...NE_GROUND],
      themes: [woodland(['np-white-oak','np-sugar-maple','np-tulip-poplar','np-mountain-laurel','np-christmas-fern']),
               poll(['np-summersweet','np-elderberry','np-bee-balm','np-joe-pye-weed','np-butterfly-milkweed']),
               shade(['np-eastern-hemlock','np-american-beech','np-spicebush','np-wild-ginger','np-solomon-seal'])] },
    { name: 'Harrisburg', usdaZone: '6b', lat: 40.27, lng: -76.88, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-eastern-redbud','np-pawpaw'],
      themes: [shade(['np-american-beech','np-pawpaw','np-spicebush','np-christmas-fern','np-wild-ginger']),
               poll(['np-summersweet','np-winterberry','np-bee-balm','np-joe-pye-weed']),
               woodland(['np-white-oak','np-tulip-poplar','np-sassafras','np-mountain-laurel','np-solomon-seal'])] },
  ]},

  // ─── RHODE ISLAND ───
  { code: 'RI', name: 'Rhode Island', cities: [
    { name: 'Providence', usdaZone: '6b', lat: 41.82, lng: -71.41, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-bayberry'],
      themes: [shade(['np-american-beech','np-witch-hazel','np-spicebush','np-christmas-fern','np-foamflower']),
               poll(['np-summersweet','np-winterberry','np-bee-balm','np-joe-pye-weed','np-new-england-aster']),
               rain(['np-red-maple','np-winterberry','np-inkberry','np-summersweet'])] },
    { name: 'Warwick', usdaZone: '6b', lat: 41.70, lng: -71.42, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-bayberry'],
      themes: [shade(['np-american-beech','np-witch-hazel','np-christmas-fern','np-wild-ginger']),
               poll(['np-summersweet','np-winterberry','np-bee-balm','np-new-england-aster']),
               rain(['np-red-maple','np-winterberry','np-inkberry','np-joe-pye-weed'])] },
    { name: 'Cranston', usdaZone: '6b', lat: 41.78, lng: -71.44, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-bayberry'],
      themes: [shade(['np-american-beech','np-spicebush','np-christmas-fern','np-solomon-seal']),
               poll(['np-summersweet','np-winterberry','np-columbine','np-joe-pye-weed']),
               rain(['np-red-maple','np-winterberry','np-inkberry','np-summersweet'])] },
  ]},

  // ─── SOUTH CAROLINA ───
  { code: 'SC', name: 'South Carolina', cities: [
    { name: 'Charleston', usdaZone: '8b', lat: 32.78, lng: -79.93, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, 'np-sabal-palm','np-saw-palmetto','np-dwarf-palmetto'],
      themes: [shade(['np-southern-magnolia','np-sweetbay-magnolia','np-dwarf-palmetto','np-christmas-fern']),
               poll(['np-beautyberry','np-coral-honeysuckle','np-lantana-native','np-purple-coneflower']),
               rain(['np-bald-cypress','np-sweetgum','np-virginia-sweetspire','np-blue-flag-iris'])] },
    { name: 'Columbia', usdaZone: '8a', lat: 34.00, lng: -81.03, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, 'np-white-oak','np-flowering-dogwood'],
      themes: [shade(['np-flowering-dogwood','np-eastern-redbud','np-azalea-native','np-christmas-fern','np-foamflower']),
               poll(['np-beautyberry','np-virginia-sweetspire','np-purple-coneflower','np-coral-honeysuckle']),
               drought(['np-live-oak','np-longleaf-pine','np-yaupon-holly','np-muhly-grass'])] },
    { name: 'Greenville', usdaZone: '7b', lat: 34.85, lng: -82.40, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, 'np-white-oak','np-mountain-laurel','np-flowering-dogwood'],
      themes: [shade(['np-flowering-dogwood','np-eastern-redbud','np-mountain-laurel','np-christmas-fern','np-foamflower']),
               poll(['np-beautyberry','np-virginia-sweetspire','np-purple-coneflower','np-bee-balm']),
               woodland(['np-white-oak','np-tulip-poplar','np-mountain-laurel','np-spicebush','np-woodland-phlox'])] },
  ]},

  // ─── SOUTH DAKOTA ───
  { code: 'SD', name: 'South Dakota', cities: [
    { name: 'Sioux Falls', usdaZone: '4b', lat: 43.55, lng: -96.73, plantIds: [...MW_TREES.slice(0,6), ...MW_SHRUBS, ...MW_GROUND],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-switchgrass','np-purple-coneflower','np-blazing-star']),
               drought(['np-bur-oak','np-hackberry','np-leadplant','np-little-bluestem','np-buffalo-grass']),
               poll(['np-elderberry','np-butterfly-milkweed','np-wild-bergamot'])] },
    { name: 'Rapid City', usdaZone: '4b', lat: 44.08, lng: -103.23, plantIds: [...MTN_TREES, ...MTN_SHRUBS, ...MTN_GROUND, 'np-bur-oak'],
      themes: [prairie(['np-little-bluestem','np-sideoats-grama','np-blanket-flower','np-yarrow','np-blue-flax']),
               drought(['np-ponderosa-pine','np-rocky-mtn-juniper','np-big-sagebrush','np-blue-grama']),
               poll(['np-rabbitbrush','np-penstemon-strictus','np-blanket-flower'])] },
    { name: 'Aberdeen', usdaZone: '4a', lat: 45.46, lng: -98.49, plantIds: [...MW_TREES.slice(0,6), ...MW_SHRUBS, ...MW_GROUND],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-switchgrass','np-purple-coneflower']),
               drought(['np-bur-oak','np-hackberry','np-leadplant','np-buffalo-grass']),
               poll(['np-elderberry','np-butterfly-milkweed','np-wild-bergamot'])] },
  ]},

  // ─── TENNESSEE ───
  { code: 'TN', name: 'Tennessee', cities: [
    { name: 'Nashville', usdaZone: '7a', lat: 36.16, lng: -86.78, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, 'np-white-oak','np-shagbark-hickory','np-pawpaw'],
      themes: [shade(['np-eastern-redbud','np-pawpaw','np-spicebush','np-christmas-fern','np-foamflower','np-solomon-seal']),
               poll(['np-beautyberry','np-virginia-sweetspire','np-purple-coneflower','np-bee-balm','np-butterfly-milkweed']),
               woodland(['np-white-oak','np-tulip-poplar','np-shagbark-hickory','np-sassafras','np-christmas-fern'])] },
    { name: 'Memphis', usdaZone: '7b', lat: 35.15, lng: -90.05, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, 'np-bur-oak','np-hackberry'],
      themes: [shade(['np-eastern-redbud','np-azalea-native','np-spicebush','np-christmas-fern','np-foamflower']),
               poll(['np-beautyberry','np-virginia-sweetspire','np-purple-coneflower','np-coral-honeysuckle']),
               rain(['np-bald-cypress','np-sweetgum','np-red-maple','np-virginia-sweetspire'])] },
    { name: 'Knoxville', usdaZone: '7a', lat: 35.96, lng: -83.92, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, 'np-white-oak','np-mountain-laurel','np-rhododendron'],
      themes: [woodland(['np-white-oak','np-tulip-poplar','np-mountain-laurel','np-rhododendron','np-christmas-fern']),
               poll(['np-beautyberry','np-bee-balm','np-joe-pye-weed','np-butterfly-milkweed']),
               shade(['np-rhododendron','np-mountain-laurel','np-spicebush','np-christmas-fern','np-foamflower'])] },
  ]},

  // ─── TEXAS ───
  { code: 'TX', name: 'Texas', cities: [
    { name: 'Houston', usdaZone: '9a', lat: 29.76, lng: -95.37, plantIds: [...TX_TREES, ...TX_SHRUBS, ...TX_GROUND, ...SE_TREES.slice(0,5), ...SE_SHRUBS.slice(0,4)],
      themes: [shade(['np-southern-magnolia','np-eastern-redbud','np-sweetbay-magnolia','np-turks-cap','np-inland-sea-oats']),
               poll(['np-beautyberry','np-coral-honeysuckle','np-autumn-sage','np-purple-coneflower','np-lantana-native']),
               rain(['np-bald-cypress','np-sweetgum','np-virginia-sweetspire','np-muhly-grass'])] },
    { name: 'Dallas', usdaZone: '8a', lat: 32.78, lng: -96.80, plantIds: [...TX_TREES, ...TX_SHRUBS, ...TX_GROUND, 'np-bur-oak','np-hackberry'],
      themes: [drought(['np-live-oak','np-texas-mountain-laurel','np-yaupon-holly','np-texas-sage','np-red-yucca','np-blackfoot-daisy']),
               poll(['np-autumn-sage','np-mealy-blue-sage','np-purple-coneflower','np-turks-cap','np-coral-honeysuckle']),
               shade(['np-eastern-redbud','np-yaupon-holly','np-turks-cap','np-inland-sea-oats'])] },
    { name: 'Austin', usdaZone: '8b', lat: 30.27, lng: -97.74, plantIds: [...TX_TREES, ...TX_SHRUBS, ...TX_GROUND, ...SW_SHRUBS.slice(0,4)],
      themes: [drought(['np-live-oak','np-texas-mountain-laurel','np-texas-persimmon','np-texas-sage','np-red-yucca','np-blackfoot-daisy']),
               poll(['np-autumn-sage','np-mealy-blue-sage','np-turks-cap','np-purple-coneflower','np-coral-honeysuckle']),
               shade(['np-eastern-redbud','np-yaupon-holly','np-turks-cap','np-inland-sea-oats'])] },
  ]},

  // ─── UTAH ───
  { code: 'UT', name: 'Utah', cities: [
    { name: 'Salt Lake City', usdaZone: '6b', lat: 40.76, lng: -111.89, plantIds: [...MTN_TREES, ...MTN_SHRUBS, ...MTN_GROUND, 'np-hackberry'],
      themes: [drought(['np-rocky-mtn-juniper','np-gambel-oak','np-big-sagebrush','np-rabbitbrush','np-blue-grama']),
               poll(['np-rabbitbrush','np-penstemon-strictus','np-blanket-flower','np-indian-paintbrush']),
               woodland(['np-quaking-aspen','np-ponderosa-pine','np-gambel-oak','np-western-serviceberry'])] },
    { name: 'Provo', usdaZone: '6b', lat: 40.23, lng: -111.66, plantIds: [...MTN_TREES, ...MTN_SHRUBS, ...MTN_GROUND],
      themes: [drought(['np-rocky-mtn-juniper','np-gambel-oak','np-big-sagebrush','np-rabbitbrush']),
               poll(['np-rabbitbrush','np-penstemon-strictus','np-blanket-flower']),
               woodland(['np-quaking-aspen','np-ponderosa-pine','np-western-serviceberry','np-kinnikinnick'])] },
    { name: 'St. George', usdaZone: '8b', lat: 37.10, lng: -113.58, plantIds: [...SW_TREES, ...SW_SHRUBS, ...SW_GROUND],
      themes: [desert(['np-palo-verde','np-agave-americana','np-red-yucca','np-desert-spoon','np-desert-marigold']),
               drought(['np-mesquite','np-desert-willow','np-creosote','np-jojoba','np-blue-grama']),
               poll(['np-chuparosa','np-globe-mallow','np-autumn-sage'])] },
  ]},

  // ─── VERMONT ───
  { code: 'VT', name: 'Vermont', cities: [
    { name: 'Burlington', usdaZone: '5a', lat: 44.48, lng: -73.21, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-paper-birch'],
      themes: [woodland(['np-sugar-maple','np-white-pine','np-paper-birch','np-serviceberry','np-christmas-fern']),
               poll(['np-summersweet','np-elderberry','np-bee-balm','np-joe-pye-weed']),
               shade(['np-eastern-hemlock','np-american-beech','np-witch-hazel','np-christmas-fern'])] },
    { name: 'Montpelier', usdaZone: '4b', lat: 44.26, lng: -72.58, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND, 'np-paper-birch'],
      themes: [woodland(['np-sugar-maple','np-white-pine','np-paper-birch','np-serviceberry','np-christmas-fern']),
               poll(['np-summersweet','np-winterberry','np-bee-balm','np-joe-pye-weed']),
               shade(['np-eastern-hemlock','np-american-beech','np-christmas-fern','np-wild-ginger'])] },
    { name: 'Rutland', usdaZone: '4b', lat: 43.61, lng: -72.97, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND],
      themes: [shade(['np-eastern-hemlock','np-american-beech','np-witch-hazel','np-christmas-fern']),
               poll(['np-summersweet','np-winterberry','np-bee-balm','np-joe-pye-weed']),
               rain(['np-red-maple','np-winterberry','np-inkberry','np-summersweet'])] },
  ]},

  // ─── VIRGINIA ───
  { code: 'VA', name: 'Virginia', cities: [
    { name: 'Richmond', usdaZone: '7b', lat: 37.54, lng: -77.44, plantIds: [...SE_TREES, ...NE_TREES.slice(0,6), ...SE_SHRUBS, ...NE_SHRUBS.slice(0,5), ...SE_GROUND, ...NE_GROUND.slice(0,5)],
      themes: [shade(['np-flowering-dogwood','np-eastern-redbud','np-spicebush','np-christmas-fern','np-foamflower']),
               poll(['np-beautyberry','np-virginia-sweetspire','np-bee-balm','np-joe-pye-weed','np-coral-honeysuckle']),
               rain(['np-bald-cypress','np-sweetgum','np-winterberry','np-virginia-sweetspire'])] },
    { name: 'Virginia Beach', usdaZone: '8a', lat: 36.85, lng: -75.98, plantIds: [...SE_TREES, ...SE_SHRUBS, ...SE_GROUND, 'np-bayberry','np-saw-palmetto'],
      themes: [shade(['np-southern-magnolia','np-sweetbay-magnolia','np-saw-palmetto','np-christmas-fern']),
               poll(['np-beautyberry','np-coral-honeysuckle','np-purple-coneflower','np-black-eyed-susan']),
               drought(['np-live-oak','np-bayberry','np-yaupon-holly','np-muhly-grass'])] },
    { name: 'Roanoke', usdaZone: '7a', lat: 37.27, lng: -79.94, plantIds: [...SE_TREES.slice(0,8), ...NE_TREES.slice(0,8), ...SE_SHRUBS, ...NE_SHRUBS.slice(0,5), ...SE_GROUND, ...NE_GROUND.slice(0,5)],
      themes: [woodland(['np-white-oak','np-tulip-poplar','np-sugar-maple','np-mountain-laurel','np-rhododendron','np-christmas-fern']),
               poll(['np-summersweet','np-bee-balm','np-joe-pye-weed','np-butterfly-milkweed']),
               shade(['np-rhododendron','np-mountain-laurel','np-spicebush','np-christmas-fern','np-foamflower'])] },
  ]},

  // ─── WASHINGTON ───
  { code: 'WA', name: 'Washington', cities: [
    { name: 'Seattle', usdaZone: '8b', lat: 47.61, lng: -122.33, plantIds: [...PNW_TREES, ...PNW_SHRUBS, ...PNW_GROUND],
      themes: [shade(['np-western-red-cedar','np-vine-maple','np-salal','np-sword-fern','np-deer-fern']),
               poll(['np-red-flowering-currant','np-oceanspray','np-nootka-rose','np-douglas-aster']),
               rain(['np-vine-maple','np-red-osier-dogwood','np-tufted-hairgrass'])] },
    { name: 'Spokane', usdaZone: '6a', lat: 47.66, lng: -117.43, plantIds: [...PNW_TREES.slice(0,5), ...MTN_TREES.slice(0,4), ...PNW_SHRUBS, ...MTN_SHRUBS.slice(0,4), ...PNW_GROUND, ...MTN_GROUND.slice(0,4)],
      themes: [woodland(['np-douglas-fir','np-ponderosa-pine','np-quaking-aspen','np-oregon-grape','np-kinnikinnick']),
               drought(['np-ponderosa-pine','np-rocky-mtn-juniper','np-big-sagebrush','np-rabbitbrush']),
               poll(['np-red-flowering-currant','np-oceanspray','np-blanket-flower','np-fireweed'])] },
    { name: 'Tacoma', usdaZone: '8b', lat: 47.25, lng: -122.44, plantIds: [...PNW_TREES, ...PNW_SHRUBS, ...PNW_GROUND],
      themes: [shade(['np-western-red-cedar','np-vine-maple','np-salal','np-sword-fern','np-inside-out-flower']),
               poll(['np-red-flowering-currant','np-oceanspray','np-nootka-rose','np-douglas-aster']),
               woodland(['np-douglas-fir','np-pacific-madrone','np-oregon-white-oak','np-oregon-grape'])] },
  ]},

  // ─── WEST VIRGINIA ───
  { code: 'WV', name: 'West Virginia', cities: [
    { name: 'Charleston', usdaZone: '6b', lat: 38.35, lng: -81.63, plantIds: [...NE_TREES, ...SE_TREES.slice(0,4), ...NE_SHRUBS, ...NE_GROUND, 'np-pawpaw'],
      themes: [woodland(['np-white-oak','np-tulip-poplar','np-pawpaw','np-mountain-laurel','np-rhododendron','np-christmas-fern']),
               poll(['np-summersweet','np-elderberry','np-bee-balm','np-joe-pye-weed','np-butterfly-milkweed']),
               shade(['np-eastern-hemlock','np-rhododendron','np-spicebush','np-christmas-fern','np-wild-ginger'])] },
    { name: 'Huntington', usdaZone: '6b', lat: 38.42, lng: -82.45, plantIds: [...NE_TREES, ...SE_TREES.slice(0,4), ...NE_SHRUBS, ...NE_GROUND],
      themes: [shade(['np-american-beech','np-eastern-redbud','np-spicebush','np-christmas-fern','np-foamflower']),
               poll(['np-summersweet','np-elderberry','np-bee-balm','np-butterfly-milkweed']),
               rain(['np-red-maple','np-bald-cypress','np-winterberry','np-joe-pye-weed'])] },
    { name: 'Morgantown', usdaZone: '6a', lat: 39.63, lng: -79.96, plantIds: [...NE_TREES, ...NE_SHRUBS, ...NE_GROUND],
      themes: [woodland(['np-sugar-maple','np-white-oak','np-tulip-poplar','np-mountain-laurel','np-christmas-fern']),
               poll(['np-summersweet','np-winterberry','np-bee-balm','np-joe-pye-weed']),
               shade(['np-eastern-hemlock','np-american-beech','np-spicebush','np-wild-ginger'])] },
  ]},

  // ─── WISCONSIN ───
  { code: 'WI', name: 'Wisconsin', cities: [
    { name: 'Milwaukee', usdaZone: '5b', lat: 43.04, lng: -87.91, plantIds: [...MW_TREES, ...NE_TREES.slice(0,4), ...MW_SHRUBS, ...MW_GROUND, ...NE_GROUND.slice(0,4)],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-prairie-dropseed','np-purple-coneflower','np-blazing-star']),
               poll(['np-ninebark','np-elderberry','np-butterfly-milkweed','np-bee-balm']),
               shade(['np-sugar-maple','np-ironwood','np-serviceberry','np-christmas-fern','np-wild-ginger'])] },
    { name: 'Madison', usdaZone: '5a', lat: 43.07, lng: -89.40, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND, 'np-paper-birch'],
      themes: [prairie(['np-big-bluestem','np-little-bluestem','np-switchgrass','np-purple-coneflower','np-wild-bergamot']),
               poll(['np-elderberry','np-butterfly-milkweed','np-bee-balm','np-goldenrod']),
               rain(['np-buttonbush','np-red-osier-dogwood','np-switchgrass','np-joe-pye-weed'])] },
    { name: 'Green Bay', usdaZone: '5a', lat: 44.51, lng: -88.02, plantIds: [...MW_TREES, ...MW_SHRUBS, ...MW_GROUND, 'np-paper-birch','np-eastern-white-cedar'],
      themes: [woodland(['np-paper-birch','np-sugar-maple','np-white-pine','np-serviceberry','np-christmas-fern']),
               prairie(['np-big-bluestem','np-little-bluestem','np-purple-coneflower','np-blazing-star']),
               poll(['np-elderberry','np-butterfly-milkweed','np-wild-bergamot'])] },
  ]},

  // ─── WYOMING ───
  { code: 'WY', name: 'Wyoming', cities: [
    { name: 'Cheyenne', usdaZone: '5a', lat: 41.14, lng: -104.82, plantIds: [...MTN_TREES, ...MTN_SHRUBS, ...MTN_GROUND, 'np-bur-oak'],
      themes: [prairie(['np-little-bluestem','np-blue-grama','np-prairie-smoke','np-blanket-flower','np-yarrow']),
               drought(['np-rocky-mtn-juniper','np-big-sagebrush','np-rabbitbrush','np-blue-grama']),
               poll(['np-rabbitbrush','np-penstemon-strictus','np-blanket-flower'])] },
    { name: 'Casper', usdaZone: '4b', lat: 42.87, lng: -106.31, plantIds: [...MTN_TREES, ...MTN_SHRUBS, ...MTN_GROUND],
      themes: [drought(['np-rocky-mtn-juniper','np-big-sagebrush','np-rabbitbrush','np-blue-grama']),
               prairie(['np-little-bluestem','np-prairie-smoke','np-yarrow','np-blue-flax']),
               poll(['np-rabbitbrush','np-penstemon-strictus','np-blanket-flower'])] },
    { name: 'Jackson', usdaZone: '3b', lat: 43.48, lng: -110.76, plantIds: [...MTN_TREES, ...MTN_SHRUBS, ...MTN_GROUND, 'np-blue-spruce'],
      themes: [woodland(['np-quaking-aspen','np-blue-spruce','np-limber-pine','np-western-serviceberry','np-kinnikinnick']),
               poll(['np-fireweed','np-penstemon-strictus','np-indian-paintbrush','np-blanket-flower']),
               drought(['np-rocky-mtn-juniper','np-big-sagebrush','np-rabbitbrush'])] },
  ]},
];
