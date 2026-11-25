// One screen catalogue feeds the experience, gallery, and production checks.
export const screens = Object.freeze([
  { key: 'discover', title: 'Find your next place', caption: 'Discover homes, rooms, PGs and shops in your selected city.', alt: 'SPoT discovery screen with fictional home and shop listings.', source: '01_property_discovery.png' },
  { key: 'details', title: 'Look a little closer', caption: 'Review rental details, amenities and availability before you apply.', alt: 'SPoT property details screen with a fictional rental, amenities and application actions.', source: '02_property_details.png' },
  { key: 'buy', title: 'Browse properties for sale', caption: 'The Buy tab: search by locality, pick a city or All India, and sort the latest listings.', alt: 'SPoT Buy tab showing a plot for sale with price, price per sq ft and Direct owner label.', source: 'Buy tab, captured 25 Nov 2026' },
  { key: 'sale-details', title: 'Check the facts', caption: 'Price, type, area, negotiable and direct-owner details. The exact address stays with the owner.', alt: 'SPoT sale details screen for a plot with price, area, Negotiable and Direct owner chips.', source: 'Sale details, captured 25 Nov 2026' },
  { key: 'sell-choice', title: 'Rent it or sell it', caption: 'Adding a property starts with one choice: put it on rent, or sell it.', alt: 'SPoT dialog asking whether to put a property on rent or sell it.', source: 'Kind chooser, captured 25 Nov 2026' },
  { key: 'sell-editor', title: 'Sell in five steps', caption: 'Pick house, flat, shop, plot or land, and post as an owner or an agent.', alt: 'SPoT Sell a property editor, step 1 of 5, with property type and owner or agent choices.', source: 'Sale editor, captured 25 Nov 2026' },
  { key: 'dashboard', title: 'See the bigger picture', caption: 'Bring properties, units and availability into one owner workspace.', alt: 'SPoT owner dashboard showing fictional properties and portfolio details.', source: '03_landlord_dashboard.png' },
  { key: 'tenants', title: 'Keep people in view', caption: 'Organise active and past tenant records in the app.', alt: 'SPoT tenant directory showing fictional tenant records.', source: '04_tenant_management.png' },
  { key: 'rent', title: 'Follow the rent record', caption: 'Distinguish pending submissions from approved payment records.', alt: 'SPoT fictional rent history showing pending and approved payment records.', source: '05_rent_tracking.png' },
]);

export const experiences = Object.freeze([
  { key: 'renter', label: 'I’m renting', eyebrow: 'FIND A HOME, ROOM, PG OR SHOP', title: 'A place that fits.<br>A next step that feels right.', copy: 'From the first shortlist to the everyday details of your stay, keep the journey together.', screen: 'details', features: [
    { icon: 'search', title: 'Explore your options', copy: 'Find rentals by city and compare rent, amenities and available units.' },
    { icon: 'chat', title: 'Make the connection', copy: 'Save a shortlist, apply and continue the conversation in Inbox.' },
    { icon: 'key', title: 'Settle into My Stay', copy: 'See your tenancy, report rent, get due reminders and raise a complaint.' },
  ] },
  { key: 'owner', label: 'I’m a landlord', eyebrow: 'PROPERTIES, TENANTS AND RENT IN ONE PLACE', title: 'More of the picture.<br>Fewer scattered details.', copy: 'Give every property, unit and tenant record a place in your day.', screen: 'dashboard', features: [
    { icon: 'building', title: 'Organise your inventory', copy: 'Create listings, manage units and availability, and create a QR To-Let poster.' },
    { icon: 'people', title: 'Keep people connected', copy: 'Review applicants, organise tenants and request a rent agreement.' },
    { icon: 'receipt', title: 'Keep track of rent', copy: 'Review payment submissions, electricity charges and rent receipts.' },
  ] },
  { key: 'buyer', label: 'I’m buying', eyebrow: 'HOUSES, FLATS, SHOPS, PLOTS AND LAND', title: 'Find the right property.<br>Talk to the owner first.', copy: 'Browse properties for sale by city, compare the price per sq ft and see an EMI estimate before you visit.', screen: 'buy', features: [
    { icon: 'search', title: 'Search and filter', copy: 'Filter by type, budget and direct owners, and sort by price or ₹ per sq ft.' },
    { icon: 'chat', title: 'Chat with the seller', copy: 'Message from the listing. Call once the seller shares their number.' },
    { icon: 'key', title: 'Book a site visit', copy: 'Propose up to 3 times. The owner picks one and both get a reminder.' },
  ] },
  { key: 'seller', label: 'I’m selling', eyebrow: 'FOR OWNERS, AGENTS AND DEALERS', title: 'List it in five steps.<br>Stay in control.', copy: 'Post a house, flat, shop, plot or land for sale. Your phone number and full address stay private until you choose.', screen: 'sell-editor', features: [
    { icon: 'building', title: 'Post your listing', copy: 'Add photos, price, area and the papers you have ready. AI can draft the description.' },
    { icon: 'people', title: 'Answer buyer inquiries', copy: 'See who wrote, chat, and share your number only with the buyers you choose.' },
    { icon: 'check', title: 'Pause, renew or mark sold', copy: 'Listings stay live for a year. Confirm it is still available, or close it.' },
  ] },
]);
