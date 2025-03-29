import * as bootstrap from "bootstrap"
import $ from "jquery"

document.addEventListener("DOMContentLoaded", () => {
  // Initialize the review carousel with specific configuration
  const reviewCarousel = document.getElementById("reviewCarousel")
  if (reviewCarousel) {
    const carousel = new bootstrap.Carousel(reviewCarousel, {
      interval: 5000, // Change slide every 5 seconds
      wrap: true, // Continuously loop
      keyboard: true, // Allow keyboard navigation
      pause: "hover", // Pause on mouse enter
    })

    // Add keyboard navigation
    document.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        carousel.prev()
      }
      if (event.key === "ArrowRight") {
        carousel.next()
      }
    })

    // Add indicators for better navigation
    const indicators = document.createElement("div")
    indicators.className = "carousel-indicators"

    // Create indicators for each slide
    const slides = reviewCarousel.querySelectorAll(".carousel-item")
    slides.forEach((_, index) => {
      const button = document.createElement("button")
      button.type = "button"
      button.setAttribute("data-bs-target", "#reviewCarousel")
      button.setAttribute("data-bs-slide-to", index.toString())
      if (index === 0) button.classList.add("active")
      indicators.appendChild(button)
    })

    // Insert indicators at the beginning of the carousel
    reviewCarousel.insertBefore(indicators, reviewCarousel.firstChild)

    // Add touch swipe support
    let touchStartX = 0
    let touchEndX = 0

    reviewCarousel.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.touches[0].clientX
      },
      false,
    )

    reviewCarousel.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].clientX
        handleSwipe()
      },
      false,
    )

    function handleSwipe() {
      if (touchEndX < touchStartX) {
        // Swipe left
        carousel.next()
      }
      if (touchEndX > touchStartX) {
        // Swipe right
        carousel.prev()
      }
    }
  }
})

$(document).ready(() => {
  // Mock user database (in a real app, this would be server-side)
  const users = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      bio: "Avid reader and book collector",
      favoriteGenre: "Science Fiction",
      memberSince: "January 2023",
      shelves: {
        reading: [],
        read: [],
        wantToRead: [],
      },
      reviews: [],
    },
  ]

  // Current user state
  let currentUser = null

  // Check for stored user session
  const storedUser = localStorage.getItem("currentUser")
  if (storedUser) {
    currentUser = JSON.parse(storedUser)
    updateUIForLoggedInUser()
  }

  // Check if we're on the profile page and not logged in
  if (window.location.pathname.includes("profile.html") && !currentUser) {
    window.location.href = "index.html"
  }

  // DOM Manipulation: Dynamic welcome message based on time of day
  function getGreeting() {
    const hour = new Date().getHours()
    let greeting

    if (hour < 12) {
      greeting = "Good morning"
    } else if (hour < 18) {
      greeting = "Good afternoon"
    } else {
      greeting = "Good evening"
    }

    return `${greeting}, book lover! Discover your next favorite read today.`
  }

  // Update hero section with dynamic greeting
  if ($("#dynamicHeroContent").length) {
    $("#dynamicHeroContent").html(`<h3 class="text-white">${getGreeting()}</h3>`)
  }

  // jQuery animation for Get Started button
  $("#getStartedBtn").hover(
    function () {
      $(this).animate({ paddingLeft: "30px", paddingRight: "30px" }, 200)
    },
    function () {
      $(this).animate({ paddingLeft: "20px", paddingRight: "20px" }, 200)
    },
  )

  // AJAX: Load books data from JSON file
  $.ajax({
    url: "books.json",
    dataType: "json",
    success: (data) => {
      console.log("Books data loaded successfully:", data)
      // Load data based on current page
      if ($("#featuredBooks").length) {
        loadFeaturedBooks(data.featured)
      }

      if ($("#upcomingBooks").length) {
        loadUpcomingBooks(data.upcoming)
        initializeNotificationModal(data.upcoming)
      }

      if ($("#allReviewsList").length) {
        loadAllReviews(data.reviews)
      }

      // If user is logged in and on profile page, load their shelves
      if (currentUser && window.location.pathname.includes("profile.html")) {
        loadUserShelves()
        loadUserReviews()
        updateReadingStats()
        updateProfileHeader()
      }
    },
    error: (xhr, status, error) => {
      console.error("Error loading books data:", error)
      console.error("Status:", status)
      console.error("Response:", xhr.responseText)
      showNotification("Error loading books data: " + error, "danger")

      // Fallback to display some content even if AJAX fails
      if ($("#featuredBooks").length) {
        $("#featuredBooks").html(
          '<div class="col-12"><div class="alert alert-warning">Could not load featured books. Please try refreshing the page.</div></div>',
        )
      }

      if ($("#upcomingBooks").length) {
        $("#upcomingBooks").html(
          '<div class="col-12"><div class="alert alert-warning">Could not load upcoming books. Please try refreshing the page.</div></div>',
        )
      }

      if ($("#allReviewsList").length) {
        $("#allReviewsList").html(
          '<div class="col-12"><div class="alert alert-warning">Could not load reviews. Please try refreshing the page.</div></div>',
        )
      }
    },
  })

  // Load featured books
  function loadFeaturedBooks(books) {
    // Clear loading spinner
    $("#featuredBooks").empty()

    // Display featured books
    books.forEach((book) => {
      const bookCard = `
        <div class="col-md-4 mb-4 book-card" data-category="${book.category}" data-id="${book.id}">
          <div class="card h-100">
            <img src="${book.cover}" class="card-img-top" alt="${book.title}">
            <div class="card-body">
              <h5 class="card-title">${book.title}</h5>
              <p class="card-text">By ${book.author}</p>
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-primary fw-bold">$${book.price}</span>
                <span class="text-warning">
                  ${displayRating(book.rating)}
                </span>
              </div>
              <button class="btn btn-primary mt-3 view-details" data-book-id="${book.id}">View Details</button>
            </div>
          </div>
        </div>
      `
      $("#featuredBooks").append(bookCard)
    })

    // Initialize book detail view handlers
    initBookDetailHandlers()
  }

  // Load upcoming books
  function loadUpcomingBooks(books) {
    // Clear loading spinner
    $("#upcomingBooks").empty()

    // Display upcoming books
    books.forEach((book) => {
      const releaseDate = new Date(book.releaseDate)
      const formattedDate = releaseDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })

      const bookCard = `
        <div class="col-md-4 mb-4 book-card" data-category="${book.category}" data-id="${book.id}" data-release-date="${book.releaseDate}">
          <div class="card h-100">
            <div class="position-relative">
              <img src="${book.cover}" class="card-img-top" alt="${book.title}">
              <span class="release-date-badge">Coming ${formattedDate}</span>
            </div>
            <div class="card-body">
              <h5 class="card-title">${book.title}</h5>
              <p class="card-text">By ${book.author}</p>
              <p class="card-text">${book.description.substring(0, 100)}...</p>
              <button class="btn btn-primary mt-3 view-upcoming-details" data-book-id="${book.id}">View Details</button>
            </div>
          </div>
        </div>
      `
      $("#upcomingBooks").append(bookCard)
    })

    // Initialize upcoming book detail handlers
    $(".view-upcoming-details").click(function () {
      const bookId = $(this).data("book-id")
      showUpcomingBookDetails(bookId)
    })

    // Initialize date filters
    $(".date-filter").click(function () {
      const filter = $(this).data("filter")

      // Update active button
      $(".date-filter").removeClass("active")
      $(this).addClass("active")

      // Filter books by release date
      if (filter === "all") {
        $(".book-card").fadeIn()
      } else {
        const now = new Date()
        const oneMonth = new Date(now)
        oneMonth.setMonth(now.getMonth() + 1)

        const threeMonths = new Date(now)
        threeMonths.setMonth(now.getMonth() + 3)

        const endOfYear = new Date(now.getFullYear(), 11, 31)

        $(".book-card").each(function () {
          const releaseDate = new Date($(this).data("release-date"))

          if (filter === "next-month" && releaseDate <= oneMonth) {
            $(this).fadeIn()
          } else if (filter === "next-quarter" && releaseDate <= threeMonths) {
            $(this).fadeIn()
          } else if (filter === "next-year" && releaseDate <= endOfYear) {
            $(this).fadeIn()
          } else if (filter !== "next-month" && filter !== "next-quarter" && filter !== "next-year") {
            $(this).fadeIn()
          } else {
            $(this).hide()
          }
        })
      }
    })
  }

  // Load all reviews for the reviews page
  function loadAllReviews(reviews) {
    $("#allReviewsList").empty()

    if (reviews.length > 0) {
      reviews.forEach((review) => {
        const reviewDate = new Date(review.date).toLocaleDateString()

        const reviewCard = `
          <div class="col-md-6 mb-4 review-card" data-book-title="${review.bookTitle.toLowerCase()}" data-reviewer="${review.reviewer.toLowerCase()}" data-category="${review.category || ""}" data-rating="${review.rating}">
            <div class="card h-100">
              <div class="card-body">
                <h5 class="card-title">${review.bookTitle}</h5>
                <h6 class="card-subtitle mb-2 text-muted">By ${review.author}</h6>
                <div class="d-flex justify-content-between mb-3">
                  <div class="text-warning">
                    ${displayRating(review.rating)}
                  </div>
                  <small class="text-muted">${reviewDate}</small>
                </div>
                <p class="card-text">${review.reviewText}</p>
                <p class="card-text"><small class="text-muted">Reviewed by ${review.reviewer}</small></p>
              </div>
            </div>
          </div>
        `

        $("#allReviewsList").append(reviewCard)
      })
    } else {
      $("#allReviewsList").html('<p class="text-center text-muted">No reviews available.</p>')
    }

    // Initialize review filters
    $(".filter-btn").click(function () {
      const filter = $(this).data("filter")

      // Update active button
      $(".filter-btn").removeClass("active")
      $(this).addClass("active")

      // Filter reviews
      if (filter === "all") {
        $(".review-card").fadeIn()
      } else if (filter === "5-star") {
        $(".review-card").hide()
        $(".review-card[data-rating='5']").fadeIn()
      } else if (filter === "recent") {
        // Sort by date (most recent first)
        const reviewCards = $(".review-card").get()
        reviewCards.sort((a, b) => {
          const dateA = new Date($(a).find(".text-muted:eq(1)").text())
          const dateB = new Date($(b).find(".text-muted:eq(1)").text())
          return dateB - dateA
        })

        $("#allReviewsList").empty()
        reviewCards.forEach((card) => {
          $("#allReviewsList").append(card)
        })

        $(".review-card").fadeIn()
      } else {
        $(".review-card").hide()
        $(".review-card[data-category='" + filter + "']").fadeIn()
      }
    })
  }

  // Initialize notification modal
  function initializeNotificationModal(upcomingBooks) {
    $("#notificationBooksList").empty()

    upcomingBooks.forEach((book) => {
      const releaseDate = new Date(book.releaseDate)
      const formattedDate = releaseDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })

      const bookItem = `
        <div class="form-check mb-2">
          <input class="form-check-input" type="checkbox" value="${book.id}" id="notify-${book.id}">
          <label class="form-check-label" for="notify-${book.id}">
            "${book.title}" by ${book.author} (${formattedDate})
          </label>
        </div>
      `

      $("#notificationBooksList").append(bookItem)
    })

    // Pre-fill email if user is logged in
    if (currentUser) {
      $("#notificationEmail").val(currentUser.email)
    }
  }

  // Helper function to display star ratings
  function displayRating(rating) {
    const fullStars = Math.floor(rating)
    const halfStar = rating % 1 >= 0.5
    let stars = ""

    for (let i = 0; i < fullStars; i++) {
      stars += '<i class="bi bi-star-fill"></i> '
    }

    if (halfStar) {
      stars += '<i class="bi bi-star-half"></i> '
    }

    const emptyStars = 5 - Math.ceil(rating)
    for (let i = 0; i < emptyStars; i++) {
      stars += '<i class="bi bi-star"></i> '
    }

    return stars
  }

  // Initialize book detail view handlers
  function initBookDetailHandlers() {
    $(".view-details").click(function () {
      const bookId = $(this).data("book-id")
      showBookDetails(bookId)
    })
  }

  // Show book details
  function showBookDetails(bookId) {
    // AJAX request to get book details
    $.ajax({
      url: "books.json",
      dataType: "json",
      success: (data) => {
        // Find the book with the matching ID
        const book = [...data.featured, ...data.upcoming].find((b) => b.id === bookId)

        if (book) {
          // Populate modal with book details
          $("#bookDetailsModalLabel").text(book.title)
          $("#reviewBookId").val(book.id)
          $("#reviewBookTitle").val(book.title)
          $("#reviewBookAuthor").val(book.author)

          const bookDetails = `
            <div class="row">
              <div class="col-md-4">
                <img src="${book.cover}" class="img-fluid" alt="${book.title}">
              </div>
              <div class="col-md-8">
                <h4>${book.title}</h4>
                <p class="text-muted">By ${book.author}</p>
                <p>${book.description}</p>
                <p class="fw-bold">Category: ${book.category}</p>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-primary fw-bold fs-4">$${book.price}</span>
                  <span class="text-warning">
                    ${displayRating(book.rating)}
                  </span>
                </div>
                
                <div class="mt-4">
                  <h5>Book Reviews</h5>
                  <div id="bookReviews">
                    <p class="text-muted">Loading reviews...</p>
                  </div>
                </div>
              </div>
            </div>
          `

          $("#bookDetailsContent").html(bookDetails)

          // Load reviews for this book
          loadBookReviews(book.id)

          // Show the modal
          const bookDetailsModal = new bootstrap.Modal(document.getElementById("bookDetailsModal"))
          bookDetailsModal.show()
        }
      },
      error: (xhr, status, error) => {
        showNotification("Error loading book details: " + error, "danger")
      },
    })
  }

  // Show upcoming book details
  function showUpcomingBookDetails(bookId) {
    // AJAX request to get book details
    $.ajax({
      url: "books.json",
      dataType: "json",
      success: (data) => {
        // Find the book with the matching ID
        const book = data.upcoming.find((b) => b.id === bookId)

        if (book) {
          // Populate modal with book details
          $("#bookDetailsModalLabel").text(book.title + " (Upcoming)")

          const releaseDate = new Date(book.releaseDate)
          const formattedDate = releaseDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })

          const bookDetails = `
            <div class="row">
              <div class="col-md-4">
                <img src="${book.cover}" class="img-fluid" alt="${book.title}">
                <div class="mt-3 text-center">
                  <span class="badge bg-primary">Release Date: ${formattedDate}</span>
                </div>
              </div>
              <div class="col-md-8">
                <h4>${book.title}</h4>
                <p class="text-muted">By ${book.author}</p>
                <p>${book.description}</p>
                <p class="fw-bold">Category: ${book.category}</p>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="text-primary fw-bold fs-4">$${book.price}</span>
                </div>
                
                <div class="mt-4">
                  <h5>Pre-order Information</h5>
                  <p>This book is available for pre-order. Be among the first to read it!</p>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="notifyRelease">
                    <label class="form-check-label" for="notifyRelease">
                      Notify me when this book is released
                    </label>
                  </div>
                </div>
              </div>
            </div>
          `

          $("#bookDetailsContent").html(bookDetails)

          // Hide the "Write a Review" button for upcoming books
          $("#writeReviewBtn").hide()

          // Show the modal
          const bookDetailsModal = new bootstrap.Modal(document.getElementById("bookDetailsModal"))
          bookDetailsModal.show()
        }
      },
      error: (xhr, status, error) => {
        showNotification("Error loading book details: " + error, "danger")
      },
    })
  }

  // Load reviews for a specific book
  function loadBookReviews(bookId) {
    $.ajax({
      url: "books.json",
      dataType: "json",
      success: (data) => {
        // Filter reviews for this book
        const bookReviews = data.reviews.filter((review) => review.bookId === bookId)

        if (bookReviews.length > 0) {
          let reviewsHtml = '<div class="list-group">'

          bookReviews.forEach((review) => {
            reviewsHtml += `
              <div class="list-group-item border-0 px-0">
                <div class="d-flex justify-content-between">
                  <span class="text-warning">${displayRating(review.rating)}</span>
                  <small class="text-muted">Posted on ${new Date(review.date).toLocaleDateString()}</small>
                </div>
                <p class="mb-1">${review.reviewText}</p>
                <small class="text-muted">- ${review.reviewer}</small>
              </div>
            `
          })

          reviewsHtml += "</div>"
          $("#bookReviews").html(reviewsHtml)
        } else {
          $("#bookReviews").html('<p class="text-muted">No reviews yet. Be the first to review this book!</p>')
        }
      },
      error: (xhr, status, error) => {
        $("#bookReviews").html(`<p class="text-danger">Error loading reviews: ${error}</p>`)
      },
    })
  }

  // Category filter functionality
  $(".category-filter").click(function () {
    const category = $(this).data("category")

    // Update active button
    $(".category-filter").removeClass("active")
    $(this).addClass("active")

    // Filter books
    if (category === "all") {
      $(".book-card").fadeIn()
    } else {
      $(".book-card").hide()
      $(`.book-card[data-category="${category}"]`).fadeIn()
    }
  })

  // Load more books button
  $("#loadMoreBtn").click(function () {
    // Show loading state
    $(this).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...')

    // AJAX request to get more books
    $.ajax({
      url: "books.json",
      dataType: "json",
      success: (data) => {
        // Simulate delay for demo purposes
        setTimeout(() => {
          // Display new releases
          data.newReleases.forEach((book) => {
            const bookCard = `
              <div class="col-md-4 mb-4 book-card" data-category="${book.category}" data-id="${book.id}">
                <div class="card h-100">
                  <img src="${book.cover}" class="card-img-top" alt="${book.title}">
                  <div class="card-body">
                    <h5 class="card-title">${book.title}</h5>
                    <p class="card-text">By ${book.author}</p>
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="text-primary fw-bold">$${book.price}</span>
                      <span class="text-warning">
                        ${displayRating(book.rating)}
                      </span>
                    </div>
                    <button class="btn btn-primary mt-3 view-details" data-book-id="${book.id}">View Details</button>
                  </div>
                </div>
              </div>
            `
            $("#featuredBooks").append(bookCard)
          })

          // Reset button
          $("#loadMoreBtn").text("Load More Books").prop("disabled", true)

          // Apply current category filter
          const activeCategory = $(".category-filter.active").data("category")
          if (activeCategory !== "all") {
            $(".book-card").hide()
            $(`.book-card[data-category="${activeCategory}"]`).fadeIn()
          }

          // Reinitialize book detail handlers
          initBookDetailHandlers()

          // Animate new content
          $(".book-card").slice(-3).hide().slideDown(1000)
        }, 1000)
      },
      error: (xhr, status, error) => {
        $("#loadMoreBtn").text("Load More Books")
        showNotification("Error loading more books: " + error, "danger")
      },
    })
  })

  // Add Review button click handler
  $("#addReviewBtn, #writeNewReviewBtn").click(() => {
    if (!currentUser) {
      showNotification("Please log in to write a review", "warning")
      const loginModal = new bootstrap.Modal(document.getElementById("loginModal"))
      loginModal.show()
      return
    }

    // Clear form fields
    $("#reviewBookId").val("")
    $("#reviewBookTitle").val("")
    $("#reviewBookAuthor").val("")
    $("#reviewText").val("")
    $("#reviewRating").val("0")
    $(".rating-star").removeClass("bi-star-fill").addClass("bi-star")

    const reviewModal = new bootstrap.Modal(document.getElementById("addReviewModal"))
    reviewModal.show()
  })

  // Write Review button click handler
  $("#writeReviewBtn").click(() => {
    if (!currentUser) {
      showNotification("Please log in to write a review", "warning")
      bootstrap.Modal.getInstance(document.getElementById("bookDetailsModal")).hide()
      const loginModal = new bootstrap.Modal(document.getElementById("loginModal"))
      loginModal.show()
      return
    }

    const reviewModal = new bootstrap.Modal(document.getElementById("addReviewModal"))
    bootstrap.Modal.getInstance(document.getElementById("bookDetailsModal")).hide()
    reviewModal.show()
  })

  // Edit Profile button click handler
  $("#editProfileBtn").click(() => {
    if (currentUser) {
      // Populate profile form
      $("#profileName").val(currentUser.name)
      $("#profileEmail").val(currentUser.email)
      $("#profileBio").val(currentUser.bio)
      $("#profileFavoriteGenre").val(currentUser.favoriteGenre)

      // Show modal
      const profileModal = new bootstrap.Modal(document.getElementById("profileModal"))
      profileModal.show()
    }
  })

  // Update profile header
  function updateProfileHeader() {
    if (currentUser) {
      $("#profileHeaderName").text(currentUser.name)
      $("#profileHeaderBio").text(currentUser.bio || "No bio provided")
      $("#profileHeaderMemberSince").text(currentUser.memberSince)

      // Set user initials
      const initials = currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
      $("#profileInitials").text(initials)
    }
  }

  // Filter reviews in the All Reviews modal
  $("#reviewSearchInput").on("keyup", function () {
    const value = $(this).val().toLowerCase()
    $(".review-card").filter(function () {
      const matchesBookTitle = $(this).data("book-title").indexOf(value) > -1
      const matchesReviewer = $(this).data("reviewer").indexOf(value) > -1
      $(this).toggle(matchesBookTitle || matchesReviewer)
    })
  })

  // Rating stars functionality
  $(".rating-star").click(function () {
    const rating = $(this).data("rating")
    $("#reviewRating").val(rating)

    // Update stars visual
    $(".rating-star").removeClass("bi-star-fill").addClass("bi-star")
    $(".rating-star").each(function () {
      if ($(this).data("rating") <= rating) {
        $(this).removeClass("bi-star").addClass("bi-star-fill")
      }
    })
  })

  // Review form submission
  $("#reviewForm").submit(function (e) {
    e.preventDefault()
    console.log("Review form submitted")

    if (!currentUser) {
      showNotification("Please log in to submit a review", "warning")
      return
    }

    // Get form data
    const reviewData = {
      bookId: $("#reviewBookId").val() ? Number.parseInt($("#reviewBookId").val()) : null,
      bookTitle: $("#reviewBookTitle").val(),
      author: $("#reviewBookAuthor").val(),
      reviewText: $("#reviewText").val(),
      rating: Number.parseFloat($("#reviewRating").val()),
      reviewer: currentUser.name,
      date: new Date().toISOString(),
      category: "Fiction", // Default category, can be improved
    }

    console.log("Review data:", reviewData)

    // Validate rating
    if (reviewData.rating === 0) {
      showNotification("Please select a rating", "warning")
      return
    }

    // Add review to user's reviews
    currentUser.reviews.push(reviewData)
    updateUserInStorage()

    // Reset form and close modal
    this.reset()
    $(".rating-star").removeClass("bi-star-fill").addClass("bi-star")

    // Close modal if it exists
    const modal = bootstrap.Modal.getInstance(document.getElementById("addReviewModal"))
    if (modal) {
      modal.hide()
    }

    // Show success notification
    showNotification("Your review has been added successfully!", "success")

    // Update user's reviews in My Books section if on profile page
    if (window.location.pathname.includes("profile.html")) {
      loadUserReviews()
      updateReadingStats()
    }

    // Redirect to profile page if not already there
    if (!window.location.pathname.includes("profile.html")) {
      window.location.href = "profile.html#my-reviews"
    }
  })

  // Contact form submission with AJAX
  $("#contactForm").submit(function (e) {
    e.preventDefault()

    // Get form data
    const formData = {
      name: $("#name").val(),
      email: $("#email").val(),
      message: $("#message").val(),
    }

    // Show loading state
    const submitBtn = $(this).find("button[type='submit']")
    const originalBtnText = submitBtn.text()
    submitBtn
      .html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...')
      .prop("disabled", true)

    // Simulate AJAX request (in a real app, this would be an actual API call)
    setTimeout(() => {
      // Reset button
      submitBtn.text(originalBtnText).prop("disabled", false)

      // Show success message
      $("#contactResponse").html(`
        <div class="alert alert-success alert-dismissible fade show" role="alert">
          Thank you, ${formData.name}! Your message has been sent successfully. We'll get back to you soon.
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      `)

      // Reset form
      $("#contactForm")[0].reset()
    }, 1500)
  })

  // Notification form submission
  $("#notificationForm").submit(function (e) {
    e.preventDefault()

    const email = $("#notificationEmail").val()
    const selectedBooks = []

    $("#notificationBooksList input:checked").each(function () {
      selectedBooks.push($(this).val())
    })

    if (selectedBooks.length === 0) {
      showNotification("Please select at least one book", "warning")
      return
    }

    // Simulate AJAX request
    const submitBtn = $(this).find("button[type='submit']")
    submitBtn
      .html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Subscribing...')
      .prop("disabled", true)

    setTimeout(() => {
      submitBtn.text("Subscribe").prop("disabled", false)
      bootstrap.Modal.getInstance(document.getElementById("notificationModal")).hide()
      showNotification("You've been subscribed to release notifications!", "success")
      this.reset()
    }, 1500)
  })

  // Notify Me button click handler
  $("#notifyMeBtn").click(() => {
    const notificationModal = new bootstrap.Modal(document.getElementById("notificationModal"))
    notificationModal.show()
  })

  // Search upcoming books
  $("#upcomingSearchBtn").click(() => {
    const searchTerm = $("#upcomingSearchInput").val().toLowerCase()

    if (searchTerm.trim() === "") {
      $(".book-card").show()
      return
    }

    $("#upcomingBooks .book-card").each(function () {
      const title = $(this).find(".card-title").text().toLowerCase()
      const author = $(this).find(".card-text").first().text().toLowerCase()
      const description = $(this).find(".card-text").last().text().toLowerCase()

      if (title.includes(searchTerm) || author.includes(searchTerm) || description.includes(searchTerm)) {
        $(this).show()
      } else {
        $(this).hide()
      }
    })
  })

  // Search reviews
  $("#reviewSearchBtn").click(() => {
    const searchTerm = $("#reviewSearchInput").val().toLowerCase()

    if (searchTerm.trim() === "") {
      $(".review-card").show()
      return
    }

    $(".review-card").each(function () {
      const title = $(this).find(".card-title").text().toLowerCase()
      const author = $(this).find(".card-subtitle").text().toLowerCase()
      const reviewText = $(this).find(".card-text").first().text().toLowerCase()
      const reviewer = $(this).find(".card-text:last small").text().toLowerCase()

      if (
        title.includes(searchTerm) ||
        author.includes(searchTerm) ||
        reviewText.includes(searchTerm) ||
        reviewer.includes(searchTerm)
      ) {
        $(this).show()
      } else {
        $(this).hide()
      }
    })
  })

  // Login form submission
  $("#loginForm").submit((e) => {
    e.preventDefault()

    const email = $("#loginEmail").val()
    const password = $("#loginPassword").val()
    const rememberMe = $("#rememberMe").is(":checked")

    // Find user
    const user = users.find((u) => u.email === email && u.password === password)

    if (user) {
      // Set current user
      currentUser = user

      // Store in localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem("currentUser", JSON.stringify(currentUser))
      }

      // Update UI
      updateUIForLoggedInUser()

      // Close modal
      bootstrap.Modal.getInstance(document.getElementById("loginModal")).hide()

      // Show success notification
      showNotification("Login successful! Welcome back, " + user.name, "success")

      // If on profile page, load user's shelves and reviews
      if (window.location.pathname.includes("profile.html")) {
        loadUserShelves()
        loadUserReviews()
        updateReadingStats()
        updateProfileHeader()
      } else if (!window.location.pathname.includes("index.html")) {
        // Redirect to profile page if not on home page
        window.location.href = "profile.html"
      }
    } else {
      // Show error
      $("#loginError").text("Invalid email or password").show()
    }
  })

  // Signup form submission
  $("#signupForm").submit((e) => {
    e.preventDefault()

    const name = $("#signupName").val()
    const email = $("#signupEmail").val()
    const password = $("#signupPassword").val()
    const confirmPassword = $("#confirmPassword").val()

    // Validate passwords match
    if (password !== confirmPassword) {
      $("#signupError").text("Passwords do not match").show()
      return
    }

    // Check if email already exists
    if (users.some((u) => u.email === email)) {
      $("#signupError").text("Email already in use").show()
      return
    }

    // Create new user
    const newUser = {
      id: users.length + 1,
      name: name,
      email: email,
      password: password,
      bio: "",
      favoriteGenre: "",
      memberSince: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" }),
      shelves: {
        reading: [],
        read: [],
        wantToRead: [],
      },
      reviews: [],
    }

    // Add to users array
    users.push(newUser)

    // Set as current user
    currentUser = newUser
    localStorage.setItem("currentUser", JSON.stringify(currentUser))

    // Update UI
    updateUIForLoggedInUser()

    // Close modal
    bootstrap.Modal.getInstance(document.getElementById("signupModal")).hide()

    // Show success notification
    showNotification("Account created successfully! Welcome, " + name, "success")

    // Redirect to profile page
    window.location.href = "profile.html"
  })

  // Logout button click handler
  $("#logoutBtn").click(() => {
    // Clear current user
    currentUser = null
    localStorage.removeItem("currentUser")

    // Update UI
    updateUIForLoggedOutUser()

    // Show notification
    showNotification("You have been logged out", "success")

    // Redirect to home page if on profile page
    if (window.location.pathname.includes("profile.html")) {
      window.location.href = "index.html"
    }
  })

  // Profile form submission
  $("#profileForm").submit((e) => {
    e.preventDefault()

    if (currentUser) {
      // Update user data
      currentUser.name = $("#profileName").val()
      currentUser.bio = $("#profileBio").val()
      currentUser.favoriteGenre = $("#profileFavoriteGenre").val()

      // Update storage
      updateUserInStorage()

      // Update UI
      $("#userDisplayName").text(currentUser.name)
      updateProfileHeader()

      // Close modal
      bootstrap.Modal.getInstance(document.getElementById("profileModal")).hide()

      // Show notification
      showNotification("Profile updated successfully", "success")
    }
  })

  // Delete account button click handler
  $("#deleteAccountBtn").click(() => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      // Remove user from array
      const index = users.findIndex((u) => u.id === currentUser.id)
      if (index !== -1) {
        users.splice(index, 1)
      }

      // Clear current user
      currentUser = null
      localStorage.removeItem("currentUser")

      // Update UI
      updateUIForLoggedOutUser()

      // Close modal
      bootstrap.Modal.getInstance(document.getElementById("profileModal")).hide()

      // Show notification
      showNotification("Your account has been deleted", "success")

      // Redirect to home page
      window.location.href = "index.html"
    }
  })

  // Add to shelf functionality
  $(".add-to-shelf").click(function () {
    if (!currentUser) {
      showNotification("Please log in to add books to your shelves", "warning")
      return
    }

    const shelf = $(this).data("shelf")
    const bookId = $("#reviewBookId").val()

    // Get book details
    $.ajax({
      url: "books.json",
      dataType: "json",
      success: (data) => {
        const book = [...data.featured, ...data.newReleases].find((b) => b.id === Number.parseInt(bookId))

        if (book) {
          // Check if book is already on any shelf
          const isOnReading = currentUser.shelves.reading.some((b) => b.id === book.id)
          const isOnRead = currentUser.shelves.read.some((b) => b.id === book.id)
          const isOnWantToRead = currentUser.shelves.wantToRead.some((b) => b.id === book.id)

          if (isOnReading || isOnRead || isOnWantToRead) {
            // Remove from current shelf
            if (isOnReading) {
              currentUser.shelves.reading = currentUser.shelves.reading.filter((b) => b.id !== book.id)
            }
            if (isOnRead) {
              currentUser.shelves.read = currentUser.shelves.read.filter((b) => b.id !== book.id)
            }
            if (isOnWantToRead) {
              currentUser.shelves.wantToRead = currentUser.shelves.wantToRead.filter((b) => b.id !== book.id)
            }
          }

          // Add to selected shelf
          if (shelf === "reading") {
            currentUser.shelves.reading.push(book)
          } else if (shelf === "read") {
            currentUser.shelves.read.push(book)
          } else if (shelf === "want-to-read") {
            currentUser.shelves.wantToRead.push(book)
          }

          // Update storage
          updateUserInStorage()

          // Update UI if on profile page
          if (window.location.pathname.includes("profile.html")) {
            loadUserShelves()
            updateReadingStats()
          }

          // Close modal
          bootstrap.Modal.getInstance(document.getElementById("bookDetailsModal")).hide()

          // Show notification
          showNotification(`"${book.title}" added to your ${getShelfDisplayName(shelf)} shelf`, "success")

          // Redirect to profile page if not already there
          if (!window.location.pathname.includes("profile.html")) {
            window.location.href = "profile.html"
          }
        }
      },
    })
  })

  // Helper function to get shelf display name
  function getShelfDisplayName(shelf) {
    switch (shelf) {
      case "reading":
        return "Currently Reading"
      case "read":
        return "Read"
      case "want-to-read":
        return "Want to Read"
      default:
        return shelf
    }
  }

  // Load user's shelves
  function loadUserShelves() {
    if (!currentUser) return

    // Currently Reading shelf
    if (currentUser.shelves.reading.length > 0) {
      $("#currentlyReadingBooks").empty()

      currentUser.shelves.reading.forEach((book) => {
        const bookCard = createBookShelfItem(book, "reading")
        $("#currentlyReadingBooks").append(bookCard)
      })
    } else {
      $("#currentlyReadingBooks").html(`
        <div class="col-12 text-center py-5">
          <p class="text-muted">You haven't added any books to your "Currently Reading" list yet.</p>
          <a href="index.html#featured" class="btn btn-primary mt-3">Browse Books to Add</a>
        </div>
      `)
    }

    // Read shelf
    if (currentUser.shelves.read.length > 0) {
      $("#readBooks").empty()

      currentUser.shelves.read.forEach((book) => {
        const bookCard = createBookShelfItem(book, "read")
        $("#readBooks").append(bookCard)
      })
    } else {
      $("#readBooks").html(`
        <div class="col-12 text-center py-5">
          <p class="text-muted">You haven't added any books to your "Read" list yet.</p>
        </div>
      `)
    }

    // Want to Read shelf
    if (currentUser.shelves.wantToRead.length > 0) {
      $("#wantToReadBooks").empty()

      currentUser.shelves.wantToRead.forEach((book) => {
        const bookCard = createBookShelfItem(book, "want-to-read")
        $("#wantToReadBooks").append(bookCard)
      })
    } else {
      $("#wantToReadBooks").html(`
        <div class="col-12 text-center py-5">
          <p class="text-muted">You haven't added any books to your "Want to Read" list yet.</p>
        </div>
      `)
    }

    // Initialize remove from shelf buttons
    $(".remove-from-shelf").click(function () {
      const bookId = $(this).data("book-id")
      const shelf = $(this).data("shelf")

      removeFromShelf(bookId, shelf)
    })

    // Initialize book detail view handlers
    $(".view-details").click(function () {
      const bookId = $(this).data("book-id")
      showBookDetails(bookId)
    })
  }

  // Create book shelf item
  function createBookShelfItem(book, shelf) {
    return `
      <div class="col-md-4 mb-4 book-shelf-item">
        <div class="card h-100">
          <div class="position-relative">
            <img src="${book.cover}" class="card-img-top" alt="${book.title}">
            <button class="remove-from-shelf btn btn-sm btn-light" data-book-id="${book.id}" data-shelf="${shelf}">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="card-body">
            <h5 class="card-title">${book.title}</h5>
            <p class="card-text">By ${book.author}</p>
            <div class="d-flex justify-content-between align-items-center">
              <span class="text-primary fw-bold">$${book.price}</span>
              <span class="text-warning">
                ${displayRating(book.rating)}
              </span>
            </div>
            <button class="btn btn-primary mt-3 view-details" data-book-id="${book.id}">View Details</button>
          </div>
        </div>
      </div>
    `
  }

  // Remove from shelf
  function removeFromShelf(bookId, shelf) {
    if (!currentUser) return

    bookId = Number.parseInt(bookId)

    if (shelf === "reading") {
      currentUser.shelves.reading = currentUser.shelves.reading.filter((book) => book.id !== bookId)
    } else if (shelf === "read") {
      currentUser.shelves.read = currentUser.shelves.read.filter((book) => book.id !== bookId)
    } else if (shelf === "want-to-read") {
      currentUser.shelves.wantToRead = currentUser.shelves.wantToRead.filter((book) => book.id !== bookId)
    }

    // Update storage
    updateUserInStorage()

    // Update UI
    loadUserShelves()
    updateReadingStats()

    // Show notification
    showNotification("Book removed from your shelf", "success")
  }

  // Load user's reviews
  function loadUserReviews() {
    if (!currentUser) return

    if (currentUser.reviews.length > 0) {
      $("#userReviews").empty()

      currentUser.reviews.forEach((review) => {
        const reviewCard = `
          <div class="col-md-6 mb-4">
            <div class="card h-100">
              <div class="card-body">
                <h5 class="card-title">${review.bookTitle}</h5>
                <h6 class="card-subtitle mb-2 text-muted">By ${review.author}</h6>
                <div class="text-warning mb-2">
                  ${displayRating(review.rating)}
                </div>
                <p class="card-text">${review.reviewText}</p>
                <p class="card-text"><small class="text-muted">Reviewed on ${new Date(review.date).toLocaleDateString()}</small></p>
              </div>
            </div>
          </div>
        `

        $("#userReviews").append(reviewCard)
      })
    } else {
      $("#userReviews").html(`
        <div class="col-12 text-center py-5">
          <p class="text-muted">You haven't written any reviews yet.</p>
        </div>
      `)
    }
  }

  // Update reading stats
  function updateReadingStats() {
    if (!currentUser) return

    $("#statsReading").text(currentUser.shelves.reading.length)
    $("#statsRead").text(currentUser.shelves.read.length)
    $("#statsReviews").text(currentUser.reviews.length)
  }

  // Update user in storage
  function updateUserInStorage() {
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser))

      // Also update in users array
      const index = users.findIndex((u) => u.id === currentUser.id)
      if (index !== -1) {
        users[index] = currentUser
      }
    }
  }

  // Update UI for logged in user
  function updateUIForLoggedInUser() {
    $(".logged-in").show()
    $(".logged-out").hide()
    $(".user-nav-item").show()
    $("#userDisplayName").text(currentUser.name)
  }

  // Update UI for logged out user
  function updateUIForLoggedOutUser() {
    $(".logged-in").hide()
    $(".logged-out").show()
    $(".user-nav-item").hide()
  }

  // Notification function
  function showNotification(message, type = "success") {
    const notification = $(`
      <div class="alert alert-${type} alert-dismissible fade show notification" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `)

    $("body").append(notification)

    // Position the notification
    notification.css({
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 9999,
      maxWidth: "300px",
    })

    // Add animation
    notification.hide().slideDown(300)

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      notification.slideUp(300, function () {
        $(this).remove()
      })
    }, 5000)
  }

  // Chat functionality
  const chatBox = document.getElementById("chatBox")
  const openChatBox = document.getElementById("openChatBox")
  const closeChatBox = document.getElementById("closeChatBox")
  const chatForm = document.getElementById("chatForm")
  const chatInput = document.getElementById("chatInput")
  const chatMessages = document.getElementById("chatMessages")

  openChatBox.addEventListener("click", () => {
    $(chatBox).fadeIn(300)
    $(openChatBox).fadeOut(300)
  })

  closeChatBox.addEventListener("click", () => {
    $(chatBox).fadeOut(300)
    $(openChatBox).fadeIn(300)
  })

  chatForm.addEventListener("submit", (event) => {
    event.preventDefault()
    const message = chatInput.value.trim()
    if (message) {
      addMessage("You", message)
      chatInput.value = ""

      // Simulate typing indicator
      const typingIndicator = document.createElement("div")
      typingIndicator.className = "typing-indicator"
      typingIndicator.innerHTML = "Support is typing..."
      chatMessages.appendChild(typingIndicator)
      chatMessages.scrollTop = chatMessages.scrollHeight

      // Simulate response after delay
      setTimeout(() => {
        // Remove typing indicator
        typingIndicator.remove()

        // Add response based on message content
        let response = "Thank you for your message. How can I assist you with your reading journey today?"

        if (message.toLowerCase().includes("book") || message.toLowerCase().includes("read")) {
          response =
            "We have a wide selection of books available. You can browse our featured collection or check out upcoming releases. Is there a specific genre you're interested in?"
        } else if (message.toLowerCase().includes("review") || message.toLowerCase().includes("rating")) {
          response =
            "You can read reviews from other readers or write your own reviews for books you've read. Your insights help our community discover great books!"
        } else if (message.toLowerCase().includes("account") || message.toLowerCase().includes("profile")) {
          response =
            "You can manage your account settings through your profile. Track your reading progress, update your preferences, and manage your reviews all in one place."
        } else if (message.toLowerCase().includes("shelf") || message.toLowerCase().includes("collection")) {
          response =
            "Your virtual bookshelves help you organize your reading. Add books to 'Currently Reading', 'Read', or 'Want to Read' shelves to keep track of your literary journey."
        }

        addMessage("Support", response)
      }, 1500)
    }
  })

  function addMessage(sender, message) {
    const messageElement = document.createElement("div")
    messageElement.className = sender === "You" ? "user-message" : "support-message"
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`

    // Add with animation
    $(messageElement).hide()
    $(chatMessages).append(messageElement)
    $(messageElement).slideDown(300)

    chatMessages.scrollTop = chatMessages.scrollHeight
  }

  // Initialize existing functionality
  const forms = document.querySelectorAll("form")
  forms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }
      form.classList.add("was-validated")
    })
  })

  // Welcome notification
  showNotification("Welcome to Book Manager! Explore our collection and find your next favorite read.")
})

