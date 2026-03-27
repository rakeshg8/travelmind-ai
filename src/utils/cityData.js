import { supabase } from "../config/supabase";
import { generateEmbedding } from "../services/cohereService";

export const CITY_KNOWLEDGE = [
  {
    city: "Bengaluru",
    place_name: "Toit Brewpub",
    category: "restaurant",
    description:
      "Toit on Indiranagar 100 Feet Road is one of Bengaluru's most loved microbreweries. It is known for fresh craft beer, wood-fired pizzas, and lively post-work energy. Service is quick before peak hours and the ambience works for both social and solo visits. Reach before 7 PM on weekends to avoid long waits.",
    address: "298, 100 Feet Rd, Indiranagar, Bengaluru",
    budget_level: "mid",
    best_time: "Evening",
    tags: ["brewery", "pizza", "indiranagar", "social"],
  },
  {
    city: "Bengaluru",
    place_name: "Indian Coffee House MG Road",
    category: "cafe",
    description:
      "This heritage cafe near MG Road serves classic filter coffee and simple South Indian snacks. The place has old-world colonial interiors and is perfect for a slow solo break. It is budget friendly and usually quieter in late mornings. Great spot to reset between meetings.",
    address: "40, Church St, Shanthala Nagar, Bengaluru",
    budget_level: "budget",
    best_time: "Late morning",
    tags: ["filter coffee", "historic", "quiet", "budget"],
  },
  {
    city: "Bengaluru",
    place_name: "Lalbagh Botanical Garden",
    category: "sightseeing",
    description:
      "Lalbagh is a vast botanical garden with a historic glasshouse and centuries-old trees. It is ideal for morning walks, light photography, and decompressing after long travel. Paths are easy to navigate and food options are available outside the gates. Carry water in summer because sections get humid.",
    address: "Mavalli, Bengaluru",
    budget_level: "budget",
    best_time: "Morning",
    tags: ["nature", "walk", "photography", "relax"],
  },
  {
    city: "Bengaluru",
    place_name: "UB City",
    category: "activity",
    description:
      "UB City offers premium dining, designer shopping, and polished business lounges in central Bengaluru. It is useful for high-end client meetings and short upscale evening plans. Most venues accept reservations and valet parking is available. Expect luxury pricing across restaurants.",
    address: "24, Vittal Mallya Rd, Ashok Nagar, Bengaluru",
    budget_level: "luxury",
    best_time: "Evening",
    tags: ["luxury", "shopping", "business", "fine dining"],
  },
  {
    city: "Bengaluru",
    place_name: "Nandi Hills Sunrise Point",
    category: "sightseeing",
    description:
      "Nandi Hills is a popular sunrise destination about 60 km from Bengaluru city center. It offers cool weather, scenic viewpoints, and quick nature trails. Start early around 4:30 AM to beat traffic and entry queues. Good for a half-day escape with minimal planning.",
    address: "Nandi Hills, Chikkaballapur district",
    budget_level: "budget",
    best_time: "Early morning",
    tags: ["sunrise", "road trip", "nature", "weekend"],
  },
  {
    city: "Bengaluru",
    place_name: "Kempegowda Airport Lounge",
    category: "lounge",
    description:
      "BLR airport lounges provide showers, work desks, stable Wi-Fi, and buffet options for transit travelers. They are useful during long layovers or delay situations. Access is available via lounge passes or premium cards depending on terminal. Crowds rise during late-night departure banks.",
    address: "KIA Terminal 1 and Terminal 2, Bengaluru",
    budget_level: "mid",
    best_time: "Anytime",
    tags: ["airport", "layover", "wifi", "work"],
  },
  {
    city: "Bengaluru",
    place_name: "Church Street Walk",
    category: "activity",
    description:
      "Church Street is a compact stretch with bookstores, indie cafes, and street-side energy near Brigade Road. It is excellent for short free-time windows and casual food hopping. Most places are walkable and digital payments are widely accepted. Evenings are vibrant but can be crowded.",
    address: "Church St, Ashok Nagar, Bengaluru",
    budget_level: "mid",
    best_time: "Evening",
    tags: ["walk", "cafes", "books", "street life"],
  },
  {
    city: "Bengaluru",
    place_name: "Vidhana Soudha Drive View",
    category: "sightseeing",
    description:
      "The illuminated Vidhana Soudha area is a quick visual landmark stop in central Bengaluru. It works well for a 20-minute drive-by during evening commutes. Security zones are monitored, so follow local instructions and avoid restricted areas. Pair with Cubbon Park for a balanced city loop.",
    address: "Dr Ambedkar Veedhi, Bengaluru",
    budget_level: "budget",
    best_time: "Night",
    tags: ["landmark", "quick stop", "city tour", "photography"],
  },

  {
    city: "Hyderabad",
    place_name: "Paradise Biryani Secunderabad",
    category: "restaurant",
    description:
      "Paradise is an iconic biryani destination known for aromatic rice, tender meat options, and quick table turnover. It is convenient for first-time visitors wanting a reliable Hyderabadi meal. Service is efficient even during rush but takeaway lines can grow. Ideal for lunch between city visits.",
    address: "SD Road, Secunderabad, Hyderabad",
    budget_level: "mid",
    best_time: "Lunch",
    tags: ["biryani", "iconic", "local food", "quick service"],
  },
  {
    city: "Hyderabad",
    place_name: "Charminar",
    category: "sightseeing",
    description:
      "Charminar is the defining symbol of Hyderabad and a central point for old-city exploration. The area is rich in street food, bangles, and heritage architecture. Mornings are easier for photos while evenings are more vibrant and crowded. Keep cash handy for small local purchases.",
    address: "Char Kaman, Ghansi Bazaar, Hyderabad",
    budget_level: "budget",
    best_time: "Morning",
    tags: ["heritage", "old city", "street market", "photos"],
  },
  {
    city: "Hyderabad",
    place_name: "Shilparamam",
    category: "activity",
    description:
      "Shilparamam is a crafts village showcasing traditional art, handlooms, and cultural performances. It is good for picking authentic souvenirs and evening walks. Seasonal fairs feature regional food stalls and live events. Allocate at least 90 minutes for a full visit.",
    address: "HITEC City, Madhapur, Hyderabad",
    budget_level: "budget",
    best_time: "Evening",
    tags: ["crafts", "culture", "shopping", "events"],
  },
  {
    city: "Hyderabad",
    place_name: "Falaknuma Palace Dining",
    category: "restaurant",
    description:
      "Falaknuma Palace offers a luxury heritage dining experience with curated menus and regal interiors. It is excellent for premium business dinners or celebration nights. Reservations and dress code checks are typically required in advance. Transport planning is recommended due to limited slots.",
    address: "Engine Bowli, Falaknuma, Hyderabad",
    budget_level: "luxury",
    best_time: "Dinner",
    tags: ["luxury", "heritage", "fine dining", "reservation"],
  },
  {
    city: "Hyderabad",
    place_name: "Hussain Sagar Lakefront",
    category: "sightseeing",
    description:
      "The lakefront around Tank Bund is ideal for relaxed evening views and short boat rides. It connects easily to major central neighborhoods, making it a low-effort stop. Street snacks and family-friendly attractions are nearby. Air quality and traffic are better on weekdays.",
    address: "Tank Bund Rd, Hyderabad",
    budget_level: "budget",
    best_time: "Sunset",
    tags: ["lake", "sunset", "boating", "family"],
  },
  {
    city: "Hyderabad",
    place_name: "Rajiv Gandhi Airport Lounge",
    category: "lounge",
    description:
      "Hyderabad airport lounges provide comfortable seating, charging ports, and meal options for delayed departures. They are practical for business travelers handling calls or emails in transit. Access policies vary by card and airline class. Early evening hours are usually the busiest.",
    address: "RGIA Terminal, Shamshabad, Hyderabad",
    budget_level: "mid",
    best_time: "Anytime",
    tags: ["airport", "business", "layover", "comfort"],
  },
  {
    city: "Hyderabad",
    place_name: "Trident HITEC City",
    category: "activity",
    description:
      "Trident's lobby and cafes in HITEC City are popular for polished business meetings and coffee chats. The service quality is consistent and the ambience is quiet during daytime slots. It is close to tech offices, reducing commute stress. Premium pricing applies for most menus.",
    address: "HITEC City Main Rd, Hyderabad",
    budget_level: "luxury",
    best_time: "Afternoon",
    tags: ["business", "hotel", "meeting", "quiet"],
  },
  {
    city: "Hyderabad",
    place_name: "Golconda Fort",
    category: "sightseeing",
    description:
      "Golconda Fort combines historic architecture with panoramic viewpoints over the city. The climb has stairs, so wear comfortable footwear and carry water. Guided tours help decode acoustics and royal history more effectively. Evening sound-and-light sessions are popular on weekends.",
    address: "Khair Complex, Ibrahim Bagh, Hyderabad",
    budget_level: "budget",
    best_time: "Late afternoon",
    tags: ["fort", "history", "viewpoint", "tour"],
  },

  {
    city: "Chennai",
    place_name: "Murugan Idli Shop",
    category: "restaurant",
    description:
      "Murugan Idli Shop is a trusted favorite for soft idlis, podi dosa, and quick South Indian meals. Service is streamlined, making it ideal for tight schedules. Pricing remains affordable and portions are filling. Great option for breakfast or early dinner.",
    address: "Various outlets, Chennai",
    budget_level: "budget",
    best_time: "Breakfast",
    tags: ["idli", "south indian", "quick", "budget"],
  },
  {
    city: "Chennai",
    place_name: "Marina Beach Promenade",
    category: "sightseeing",
    description:
      "Marina Beach is one of the longest urban beaches and offers a broad promenade for evening walks. Local snacks and horse rides add a lively atmosphere. It can be humid during daytime, so sunset is the most pleasant window. Keep essentials secure in crowded zones.",
    address: "Marina Loop Rd, Chennai",
    budget_level: "budget",
    best_time: "Sunset",
    tags: ["beach", "walk", "sunset", "street food"],
  },
  {
    city: "Chennai",
    place_name: "Dakshin at Crowne Plaza",
    category: "restaurant",
    description:
      "Dakshin delivers refined South Indian cuisine with region-specific tasting menus and elegant service. It is a strong choice for formal dinners and guest hosting. Booking ahead is recommended for weekend nights. The meal pacing is comfortable for long conversations.",
    address: "Adyar Park, Chennai",
    budget_level: "luxury",
    best_time: "Dinner",
    tags: ["fine dining", "south indian", "formal", "business"],
  },
  {
    city: "Chennai",
    place_name: "Semmozhi Poonga",
    category: "activity",
    description:
      "Semmozhi Poonga is a compact botanical garden in central Chennai suited for short breaks. It is clean, shaded in sections, and easy to cover within an hour. Good for solo travelers needing low-noise downtime between appointments. Photography is best in the morning.",
    address: "Cathedral Rd, Teynampet, Chennai",
    budget_level: "budget",
    best_time: "Morning",
    tags: ["garden", "quiet", "short break", "nature"],
  },
  {
    city: "Chennai",
    place_name: "Phoenix Marketcity",
    category: "activity",
    description:
      "Phoenix Marketcity combines shopping, cinemas, and dining under one roof, convenient during hot or rainy weather. It is suitable for group plans where preferences vary widely. Weekday afternoons are less crowded and more comfortable. Ride-share pickups are available at marked exits.",
    address: "142, Velachery Main Rd, Chennai",
    budget_level: "mid",
    best_time: "Afternoon",
    tags: ["mall", "shopping", "food", "indoor"],
  },
  {
    city: "Chennai",
    place_name: "Chennai Airport Lounge",
    category: "lounge",
    description:
      "Chennai airport lounges offer basic comfort with refreshments, seating, and work areas for transit time. They are practical for delayed flights and late-night departures. Access depends on card networks and airlines. Noise levels can rise during peak domestic hours.",
    address: "MAA Airport Terminals, Chennai",
    budget_level: "mid",
    best_time: "Anytime",
    tags: ["airport", "transit", "work", "delay"],
  },
  {
    city: "Chennai",
    place_name: "Kapaleeshwarar Temple",
    category: "sightseeing",
    description:
      "This temple in Mylapore is known for colorful gopurams and active local culture around its streets. It is a meaningful stop for architecture, rituals, and nearby traditional shops. Dress modestly and plan footwear storage at entry. Early mornings are calmer for exploration.",
    address: "Mylapore, Chennai",
    budget_level: "budget",
    best_time: "Morning",
    tags: ["temple", "culture", "architecture", "mylapore"],
  },
  {
    city: "Chennai",
    place_name: "Elliot's Beach Cafes",
    category: "cafe",
    description:
      "Besant Nagar's beachside cafe cluster offers relaxed seating, coffee, and light meals with sea breeze evenings. It works well for informal meetups and solo journaling sessions. Most outlets support UPI and card payments. Parking gets tight after 7 PM.",
    address: "Besant Nagar Beach Rd, Chennai",
    budget_level: "mid",
    best_time: "Evening",
    tags: ["beach", "cafe", "relaxed", "meetup"],
  },

  {
    city: "Mumbai",
    place_name: "Leopold Cafe",
    category: "restaurant",
    description:
      "Leopold Cafe in Colaba is a classic Mumbai stop with global comfort food and bustling atmosphere. It is convenient for travelers exploring South Mumbai landmarks in one loop. Service is generally quick despite high footfall. Best visited before peak dinner crowds.",
    address: "Colaba Causeway, Mumbai",
    budget_level: "mid",
    best_time: "Evening",
    tags: ["iconic", "colaba", "casual", "tourist"],
  },
  {
    city: "Mumbai",
    place_name: "Gateway of India",
    category: "sightseeing",
    description:
      "Gateway of India is a central waterfront landmark ideal for short city introductions and ferry views. It is close to hotels and transport, making logistics easy. Morning visits are cleaner and less congested for photos. Street vendors and photographers are common around the plaza.",
    address: "Apollo Bandar, Colaba, Mumbai",
    budget_level: "budget",
    best_time: "Morning",
    tags: ["landmark", "waterfront", "photos", "heritage"],
  },
  {
    city: "Mumbai",
    place_name: "BKC Business Lunch Hubs",
    category: "restaurant",
    description:
      "Bandra Kurla Complex has multiple polished restaurants suitable for business lunches and investor meetings. Tables turn quickly in weekdays, so booking helps during noon rush. Parking and cab access are better on inner roads than highway edges. Menus range from Indian to pan-Asian.",
    address: "BKC, Bandra East, Mumbai",
    budget_level: "luxury",
    best_time: "Lunch",
    tags: ["business", "bkc", "meeting", "premium"],
  },
  {
    city: "Mumbai",
    place_name: "Marine Drive",
    category: "activity",
    description:
      "Marine Drive is ideal for sunset walks, ocean views, and decompression after dense city schedules. The promenade is open, safe, and easy to access by taxi. Evenings are crowded but energetic, especially near Nariman Point. Carry light layers during monsoon winds.",
    address: "Netaji Subhash Chandra Bose Rd, Mumbai",
    budget_level: "budget",
    best_time: "Sunset",
    tags: ["walk", "sunset", "sea view", "relax"],
  },
  {
    city: "Mumbai",
    place_name: "T2 Lounge Mumbai Airport",
    category: "lounge",
    description:
      "Terminal 2 lounges in Mumbai provide showers, charging points, and quality buffet options for domestic and international travelers. They are excellent during delay-heavy weather windows. Staff usually assist with flight display and boarding reminders. Access depends on ticket class or partner cards.",
    address: "CSMIA Terminal 2, Mumbai",
    budget_level: "mid",
    best_time: "Anytime",
    tags: ["airport", "comfort", "delay", "transit"],
  },
  {
    city: "Mumbai",
    place_name: "Sanjay Gandhi National Park",
    category: "sightseeing",
    description:
      "This large urban national park offers trails, greenery, and cave history within city limits. It is a strong half-day reset for travelers needing nature without leaving Mumbai. Start early to avoid heat and maximize trail comfort. Entry and safari experiences are separately ticketed.",
    address: "Borivali East, Mumbai",
    budget_level: "budget",
    best_time: "Morning",
    tags: ["nature", "trails", "half day", "caves"],
  },
  {
    city: "Mumbai",
    place_name: "Juhu Beach Street Bites",
    category: "activity",
    description:
      "Juhu Beach is known for evening snacks like pav bhaji and kulfi with lively local crowds. It is a casual stop for group travelers after meetings or sightseeing. Cleanliness varies by zone, so choose busier maintained stretches. Weekdays are less chaotic than weekends.",
    address: "Juhu Tara Rd, Mumbai",
    budget_level: "budget",
    best_time: "Evening",
    tags: ["street food", "beach", "casual", "group"],
  },
  {
    city: "Mumbai",
    place_name: "Kala Ghoda Art District",
    category: "sightseeing",
    description:
      "Kala Ghoda offers galleries, design stores, and walkable heritage architecture in South Mumbai. It is excellent for culture-focused travelers with 2-3 free hours. Cafes nearby are suitable for remote work breaks. Morning to early afternoon is best for hopping between venues.",
    address: "Kala Ghoda, Fort, Mumbai",
    budget_level: "mid",
    best_time: "Afternoon",
    tags: ["art", "culture", "walkable", "cafes"],
  },

  {
    city: "Delhi",
    place_name: "India Gate Lawns",
    category: "sightseeing",
    description:
      "India Gate remains a top central landmark with broad lawns and evening activity. It is easy to pair with nearby museums and government district drives. Night lighting makes quick photo stops attractive for first-time visitors. Security checks and traffic diversions can vary during events.",
    address: "Rajpath Area, New Delhi",
    budget_level: "budget",
    best_time: "Evening",
    tags: ["landmark", "family", "photos", "central"],
  },
  {
    city: "Delhi",
    place_name: "Khan Market Cafes",
    category: "cafe",
    description:
      "Khan Market has reliable premium cafes and bookstores, useful for client catch-ups and solo planning sessions. Most outlets provide stable seating and quick service in daytime slots. The area is compact and walkable, with easy rideshare access. Prices are typically mid-to-high range.",
    address: "Khan Market, New Delhi",
    budget_level: "mid",
    best_time: "Afternoon",
    tags: ["cafe", "meeting", "walkable", "books"],
  },
  {
    city: "Delhi",
    place_name: "Karim's Jama Masjid",
    category: "restaurant",
    description:
      "Karim's is famed for Mughlai cuisine and is a staple recommendation near Old Delhi heritage circuits. Rich gravies and kebabs are signature picks for food-focused travelers. Seating can be tight during peak meal hours, so expect short waits. Combine with Jama Masjid and Chandni Chowk walk.",
    address: "16, Gali Kababian, Jama Masjid, Delhi",
    budget_level: "mid",
    best_time: "Dinner",
    tags: ["mughlai", "old delhi", "food trail", "heritage"],
  },
  {
    city: "Delhi",
    place_name: "Humayun's Tomb",
    category: "sightseeing",
    description:
      "Humayun's Tomb offers well-maintained Mughal architecture, gardens, and open paths for calm exploration. It is ideal for history enthusiasts and photographers in golden-hour light. Ticketing is smooth with online options available. Morning visits help avoid heat and larger groups.",
    address: "Mathura Rd, Nizamuddin, New Delhi",
    budget_level: "budget",
    best_time: "Morning",
    tags: ["history", "architecture", "gardens", "photos"],
  },
  {
    city: "Delhi",
    place_name: "Aerocity Dining Cluster",
    category: "restaurant",
    description:
      "Aerocity hosts upscale restaurants and hotels near the airport, perfect for short business layovers. Commute times are predictable compared with inner-city peaks. Venues support reservations and corporate dining setups. Costs trend toward premium segments.",
    address: "Aerocity, New Delhi",
    budget_level: "luxury",
    best_time: "Dinner",
    tags: ["airport district", "business", "premium", "convenient"],
  },
  {
    city: "Delhi",
    place_name: "IGI T3 Lounge",
    category: "lounge",
    description:
      "Delhi IGI lounges provide workstations, rest zones, and food options useful during long international transits. They are highly practical for delay buffering and remote work continuity. Access varies by terminal, card type, and airline ticket class. Peak usage occurs late evening onward.",
    address: "IGI Airport Terminal 3, New Delhi",
    budget_level: "mid",
    best_time: "Anytime",
    tags: ["airport", "layover", "work", "international"],
  },
  {
    city: "Delhi",
    place_name: "Dilli Haat INA",
    category: "activity",
    description:
      "Dilli Haat combines regional food stalls and crafts from across India in an open cultural market format. It is ideal for souvenir shopping and tasting multiple cuisines quickly. Most kiosks are straightforward and budget friendly. Evenings are lively and good for group outings.",
    address: "INA, New Delhi",
    budget_level: "budget",
    best_time: "Evening",
    tags: ["crafts", "food", "culture", "souvenirs"],
  },
  {
    city: "Delhi",
    place_name: "Lodhi Garden",
    category: "sightseeing",
    description:
      "Lodhi Garden is a peaceful green space with historic tomb structures and jogger-friendly paths. It works well for morning fitness, reflective walks, or short photo sessions. The area is safe and frequently used by locals. Pair it with Khan Market for a balanced half-day plan.",
    address: "Lodhi Rd, New Delhi",
    budget_level: "budget",
    best_time: "Morning",
    tags: ["park", "history", "fitness", "quiet"],
  },

  {
    city: "Kolkata",
    place_name: "Flurys Park Street",
    category: "cafe",
    description:
      "Flurys is a legendary tearoom on Park Street known for pastries, breakfast platters, and classic ambience. It is a reliable choice for calm meetings and solo notebook time. Service is polished and menu variety is broad. Morning slots are quieter and more comfortable.",
    address: "18A, Park St, Kolkata",
    budget_level: "mid",
    best_time: "Breakfast",
    tags: ["heritage", "bakery", "meeting", "park street"],
  },
  {
    city: "Kolkata",
    place_name: "Victoria Memorial",
    category: "sightseeing",
    description:
      "Victoria Memorial combines museum exhibits with large gardens and colonial architecture in central Kolkata. It is ideal for cultural context and easy-paced exploration. Tickets are straightforward and audio guides are available. Sunset adds dramatic light for photography.",
    address: "1, Queens Way, Kolkata",
    budget_level: "budget",
    best_time: "Late afternoon",
    tags: ["museum", "history", "architecture", "gardens"],
  },
  {
    city: "Kolkata",
    place_name: "Peter Cat",
    category: "restaurant",
    description:
      "Peter Cat is famous for Chelo Kebabs and remains a classic dinner recommendation on Park Street. The menu balances local favorites with continental options for mixed groups. Wait times can rise after 8 PM, so arriving earlier helps. Portions are generous and service is efficient.",
    address: "18A, Park St, Kolkata",
    budget_level: "mid",
    best_time: "Dinner",
    tags: ["chelo kebab", "park street", "iconic", "group dining"],
  },
  {
    city: "Kolkata",
    place_name: "Howrah Bridge Riverfront",
    category: "sightseeing",
    description:
      "The riverfront near Howrah Bridge offers strong city character with ferry movement and skyline views. It is a compact stop for first-time visitors covering old and new Kolkata routes. Evening visits give lively visuals and cooler weather. Keep belongings secure in crowded transit pockets.",
    address: "Howrah Bridge Approach, Kolkata",
    budget_level: "budget",
    best_time: "Evening",
    tags: ["landmark", "riverfront", "photos", "city life"],
  },
  {
    city: "Kolkata",
    place_name: "Eco Park New Town",
    category: "activity",
    description:
      "Eco Park provides cycling, boating, and themed zones spread across a large landscaped area in New Town. It is suitable for families and groups with varied interests. Rent options and internal transport help cover more sections in less time. Weekday afternoons are less crowded.",
    address: "Action Area II, New Town, Kolkata",
    budget_level: "budget",
    best_time: "Afternoon",
    tags: ["park", "boating", "cycling", "family"],
  },
  {
    city: "Kolkata",
    place_name: "ITC Sonar Lounge",
    category: "lounge",
    description:
      "ITC Sonar's lounge spaces are useful for premium meetings, tea sessions, and short executive breaks. The property is known for polished hospitality and business-friendly seating. It works well for traveler networking before evening events. Reserve in advance for larger groups.",
    address: "JBS Haldane Ave, Kolkata",
    budget_level: "luxury",
    best_time: "Evening",
    tags: ["luxury", "business", "hotel", "meeting"],
  },
  {
    city: "Kolkata",
    place_name: "Dakshineswar Temple",
    category: "sightseeing",
    description:
      "Dakshineswar is an important spiritual landmark with riverside setting and strong local significance. Early visits are smoother for darshan and queue management. Dress modestly and factor festival crowds when planning. Nearby ferry routes can add a scenic transit leg.",
    address: "Dakshineswar, Kolkata",
    budget_level: "budget",
    best_time: "Morning",
    tags: ["temple", "spiritual", "riverside", "heritage"],
  },
  {
    city: "Kolkata",
    place_name: "Biswa Bangla Gate Sky Deck",
    category: "activity",
    description:
      "Biswa Bangla Gate's elevated dining and sky deck views provide a modern Kolkata perspective in New Town. It is a strong evening option for scenic dinners and city lights. Tickets or reservations may be needed for specific time windows. Pair with Eco Park for a full circuit.",
    address: "Narkelbagan, New Town, Kolkata",
    budget_level: "mid",
    best_time: "Night",
    tags: ["sky deck", "new town", "views", "dinner"],
  },
];

export async function embedAndSeedKnowledge() {
  try {
    const { count, error: countError } = await supabase
      .from("place_knowledge")
      .select("id", { count: "exact", head: true });

    if (countError) {
      throw countError;
    }

    if ((count || 0) > 0) {
      return { seeded: false, reason: "Knowledge already present." };
    }

    const rows = [];
    for (const item of CITY_KNOWLEDGE) {
      const embedding = await generateEmbedding(
        `${item.city} ${item.place_name} ${item.description} ${(item.tags || []).join(" ")}`,
        "search_document"
      );

      rows.push({
        ...item,
        content_embedding: embedding,
      });
    }

    const { error } = await supabase.from("place_knowledge").insert(rows);
    if (error) {
      throw error;
    }

    return { seeded: true, inserted: rows.length };
  } catch (error) {
    throw new Error(`Knowledge seeding failed: ${error.message}`);
  }
}
