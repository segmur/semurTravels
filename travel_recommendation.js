// DOM Element References
const homePage = document.getElementById('homePage');
const aboutPage = document.getElementById('aboutPage');
const contactPage = document.getElementById('contactPage');
const recommendationResults = document.getElementById('recommendationResults');

const homeLink = document.getElementById('homeLink');
const aboutLink = document.getElementById('aboutLink');
const contactLink = document.getElementById('contactLink');

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resetBtn = document.getElementById('resetBtn');

let travelData = null; // Will store fetched data from JSON

// --- Page Navigation Logic ---
function showPage(pageId) {
    // Deactivate all page sections
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    // Deactivate all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Activate the requested page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Activate the corresponding nav link
    const targetLink = document.getElementById(`${pageId}Link`);
    if (targetLink) {
        targetLink.classList.add('active');
    }

    // Toggle visibility of search section based on page
    const searchSection = document.querySelector('.search-section');
    if (pageId === 'homePage') {
        searchSection.style.display = 'flex'; // Show search bar on home
    } else {
        searchSection.style.display = 'none'; // Hide search bar on other pages
        // Clear search results and input when navigating away from home
        clearResults();
    }
}

// Event Listeners for Navigation
homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('homePage');
});
aboutLink.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('aboutPage');
});
contactLink.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('contactPage');
});

// --- Data Fetching using XMLHttpRequest (XHR) ---
function fetchTravelDataXHR() {
    const xhr = new XMLHttpRequest();
    const url = 'travel_recommendation_api.json'; // Path to your JSON file

    xhr.open('GET', url, true); // Method, URL, Asynchronous
    xhr.responseType = 'json'; // Automatically parse the response as JSON

    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            travelData = xhr.response; // Assign the parsed JSON data
            console.log('Travel data loaded successfully via XHR.');
            // Optionally, you could display default recommendations here if desired
            // For now, it will just load, and search button will trigger display.
        } else {
            // Handle HTTP errors (e.g., 404 Not Found, 500 Server Error)
            console.error('Error fetching travel data via XHR. Status:', xhr.status);
            recommendationResults.innerHTML = '<p style="color: red;">Failed to load recommendations. Please check your internet connection or JSON file path.</p>';
        }
    };

    xhr.onerror = function() {
        // Handle network errors
        console.error('Network error occurred during XHR request.');
        recommendationResults.innerHTML = '<p style="color: red;">A network error prevented loading recommendations. Check your connection.</p>';
    };

    xhr.send(); // Send the request
}

// --- Display Recommendations ---
function displayRecommendations(recommendations) {
    recommendationResults.innerHTML = ''; // Clear previous results

    if (!recommendations || recommendations.length === 0) {
        recommendationResults.innerHTML = '<p>No recommendations found for your search. Try "beach", "temple", or a country name like "Brazil".</p>';
        return;
    }

    recommendations.forEach(place => {
        const card = document.createElement('div');
        card.classList.add('recommendation-card');

        const img = document.createElement('img');
        img.src = place.imageUrl;
        img.alt = `Image of ${place.name}`;
        // Fallback for broken images to ensure visual consistency
        img.onerror = function() {
            this.onerror=null; // Prevent infinite loop on error
            this.src='https://placehold.co/600x400/CCCCCC/666666?text=Image+Not+Found';
            console.warn(`Failed to load image for ${place.name}. Using placeholder.`);
        };

        const content = document.createElement('div');
        content.classList.add('recommendation-card-content');

        const title = document.createElement('h3');
        title.textContent = place.name;

        const description = document.createElement('p');
        description.textContent = place.description;

        content.appendChild(title);
        content.appendChild(description);

        // Optional: Display current time for countries
        if (place.timezones && place.timezones.length > 0) {
            const timeDiv = document.createElement('div');
            timeDiv.classList.add('time-display');
            try {
                const now = new Date();
                const options = {
                    timeZone: place.timezones[0], // Use the first timezone provided
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                };
                const formattedTime = new Intl.DateTimeFormat('en-US', options).format(now);
                // Extract city/region name from timezone for display, e.g., "Sao Paulo" from "America/Sao_Paulo"
                const timezoneName = place.timezones[0].split('/').pop().replace(/_/g, ' ');
                timeDiv.textContent = `Current time in ${timezoneName}: ${formattedTime}`;
            } catch (e) {
                console.warn(`Could not get time for ${place.name} (timezone: ${place.timezones[0]}): ${e.message}`);
                timeDiv.textContent = `Time unavailable for ${place.name}`;
            }
            content.appendChild(timeDiv);
        }

        card.appendChild(img);
        card.appendChild(content);
        recommendationResults.appendChild(card);
    });
}

// --- Search Logic ---
searchBtn.addEventListener('click', () => {
    if (!travelData) {
        console.warn('Travel data not yet loaded. Please wait or check for errors.');
        recommendationResults.innerHTML = '<p style="color: orange;">Data is still loading or failed to load. Please try again.</p>';
        return;
    }

    const searchTerm = searchInput.value.toLowerCase().trim();
    let results = [];

    // Keyword matching for beaches, temples, and countries
    if (['beach', 'beaches'].includes(searchTerm)) {
        results = travelData.beaches;
    } else if (['temple', 'temples'].includes(searchTerm)) {
        results = travelData.temples;
    } else {
        // Search in countries by country name or city name
        const foundCountry = travelData.countries.find(country =>
            country.name.toLowerCase().includes(searchTerm) ||
            country.cities.some(city => city.name.toLowerCase().includes(searchTerm))
        );
        if (foundCountry) {
            results = foundCountry.cities;
        }
    }
    displayRecommendations(results);
});

// --- Clear Results Logic ---
resetBtn.addEventListener('click', clearResults);

function clearResults() {
    searchInput.value = ''; // Clear search input field
    recommendationResults.innerHTML = ''; // Clear displayed recommendations
    // Optionally re-display a default message if desired
    // recommendationResults.innerHTML = '<p>Search for travel recommendations.</p>';
}

// --- Initial Page Load Setup ---
document.addEventListener('DOMContentLoaded', () => {
    fetchTravelDataXHR(); // Call the XHR function to fetch data
    showPage('homePage'); // Display the home page by default
});

// Optional: Contact form submission (prevents default and logs data)
document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission (page reload)

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    // In a real application, you'd send this data to a server
    console.log('Contact Form Submitted:');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Message:', message);

    alert('Thank you for your message! We will get back to you soon.');
    this.reset(); // Clear the form fields after submission
});
