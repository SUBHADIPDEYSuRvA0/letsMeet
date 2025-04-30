// Main JavaScript file for MeetClone

import * as bootstrap from "bootstrap"

document.addEventListener("DOMContentLoaded", () => {
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl))

  // Initialize popovers
  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
  popoverTriggerList.map((popoverTriggerEl) => new bootstrap.Popover(popoverTriggerEl))

  // Auto-dismiss alerts
  const alertList = document.querySelectorAll(".alert-dismissible")
  alertList.forEach((alert) => {
    setTimeout(() => {
      const closeButton = alert.querySelector(".btn-close")
      if (closeButton) {
        closeButton.click()
      }
    }, 5000)
  })

  // Copy to clipboard functionality
  const copyButtons = document.querySelectorAll(".copy-btn")
  copyButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const textToCopy = this.getAttribute("data-clipboard-text")

      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          // Show success feedback
          const originalHTML = this.innerHTML
          this.innerHTML = '<i class="fas fa-check"></i>'

          setTimeout(() => {
            this.innerHTML = originalHTML
          }, 2000)
        })
        .catch((err) => {
          console.error("Could not copy text: ", err)
        })
    })
  })
})
