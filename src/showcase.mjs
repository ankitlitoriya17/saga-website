// One screen catalogue feeds the experience, gallery, and production checks.
export const screens = Object.freeze([
  { key: 'discover', title: 'Find your next place', caption: 'Discover homes, rooms, PGs and shops in your selected city.', alt: 'SPoT discovery screen with fictional home and shop listings.', source: '01_property_discovery.png' },
  { key: 'details', title: 'Look a little closer', caption: 'Review rental details, amenities and availability before you apply.', alt: 'SPoT property details screen with a fictional rental, amenities and application actions.', source: '02_property_details.png' },
  { key: 'dashboard', title: 'See the bigger picture', caption: 'Bring properties, units and availability into one owner workspace.', alt: 'SPoT owner dashboard showing fictional properties and portfolio details.', source: '03_landlord_dashboard.png' },
  { key: 'tenants', title: 'Keep people in view', caption: 'Organise active and past tenant records in the app.', alt: 'SPoT tenant directory showing fictional tenant records.', source: '04_tenant_management.png' },
  { key: 'rent', title: 'Follow the rent record', caption: 'Distinguish pending submissions from approved payment records.', alt: 'SPoT fictional rent history showing pending and approved payment records.', source: '05_rent_tracking.png' },
]);

export const experiences = Object.freeze([
  { key: 'renter', label: 'I’m finding a place', eyebrow: 'YOUR SEARCH, WITH A LITTLE MORE CLARITY', title: 'A place that fits.<br>A next step that feels right.', copy: 'From the first shortlist to the everyday details of your stay, keep the journey together.', screen: 'details', features: [
    { icon: 'search', title: 'Explore your options', copy: 'Find rentals by city and compare the details that matter to you.' },
    { icon: 'chat', title: 'Make the connection', copy: 'Save a shortlist, apply and continue the conversation in Inbox.' },
    { icon: 'key', title: 'Settle into My Stay', copy: 'See your tenancy details, report rent and raise a complaint.' },
  ] },
  { key: 'owner', label: 'I’m managing a property', eyebrow: 'YOUR RENTAL DAY, A LITTLE MORE ORGANISED', title: 'More of the picture.<br>Fewer scattered details.', copy: 'Give every property, unit and tenant record a place in your day.', screen: 'dashboard', features: [
    { icon: 'building', title: 'Organise your inventory', copy: 'Create listings and manage units, availability and rental details.' },
    { icon: 'people', title: 'Keep people connected', copy: 'Review applicants and organise active and past tenant records.' },
    { icon: 'receipt', title: 'Keep track of rent', copy: 'Review payment submissions, electricity charges and rent receipts.' },
  ] },
]);
