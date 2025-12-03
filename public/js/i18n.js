// Static translations
const translations = {
  en: {
    // Wedding
    'wedding:date': 'June 6th, 2026 • Marbella, Spain',
    'rich:wedding.common.footer': '© 2026 Boda de Iluminada &amp; George',
    'wedding:title': 'Iluminada & George',
    'wedding:hero.description': 'Iluminada and George are getting married on the beach in Marbella this June, and we’re so happy to share it with you. Expect sun, sea and lots of laughter.',
    'wedding:hero.description2': 'This site is your wedding hub. Log in with your RSVP email to confirm your party, choose your menu, see the schedule, view our gift list and chat with other guests.',
    'wedding:subtitle': 'We\'re getting married!',

    // Common  
    'common:people': 'people',
    'common:person': 'person',
    'common:days': 'Days',
    'common:enter.name': 'Enter name...',
    'common:error.saving.menu.selection': 'Error saving menu selection',
    'common:error.saving.menu.selections': 'Error saving menu selections',
    'common:error.saving.special.request': 'Error saving special request',
    'common:error.saving.special.request.details': 'Error saving special request details',
    'common:home': 'Home',
    'common:hours': 'Hours',
    'common:minutes': 'Minutes',
    'common:seconds': 'Seconds',
    'rich:common:cancel': 'Cancel',
    'rich:common:confirm': 'Confirm',
    'rich:common:confirmAction': 'Confirm action',
    'rich:common:new': '<i class="fas fa-plus-circle"></i> New',

    // Common: Menu
    'common:menu.selection.saved': 'Menu selection saved successfully!',
    'common:menu.selections.saved': 'Menu selections saved successfully!',
    'common:menu.saving': 'Saving...',
    'common:menu.special.request.details.saved': 'Special request details saved successfully!',
    'common:menu.special.request.saved': 'Special request saved successfully!',
      
    // Common: Party  
    'common:party.members': 'members',
    'common:party.adult': 'Adult (18+)',
    'common:party.age.category': 'Age Category',
    'common:party.child': 'Child',
    'common:party.name': 'Name',
    'common:party.primary.guest': 'Primary Guest',
    'common:party.primary': 'Primary',
    'common:party.remove.member': 'Remove member',
    'common:party.confirm.remove.member': 'Are you sure you want to remove {{memberName}} from your party?',

    // Logon Page
    'login:page.title': 'Guest access - Wedding',
    'login:guest.zone.title': 'Guest Zone',
    'login:header': 'Guest access',
    'login:email.label': 'Email:',
    'login:email.placeholder': 'Enter your email',
    'login:submit': 'Continue',
    'login:enter.email': 'Please enter your email.',
    'login:success.redirecting': 'Login successful. Redirecting...',
    'login:email.not.found': 'Email not found in the guest list',
    'login:server.error': 'Server connection error',

    // Guests Zone
    'guests:title': 'Guest Zone - Iluminada & George Wedding',
    'guests:welcome.title': 'Guest Zone',
    'guests:summary': 'Summary',
    'guests:party': 'Party',
    'guests:rsvp': 'RSVP',
    'guests:menu': 'Menu',
    'guests:gifts': 'Gifts',

    // Summary Page
    'guests:summaryPageTitle': 'Your guest area for Iluminada & George\'s wedding',
    'rich:guests:summaryPageDescription': `
      <p>
        Welcome to your personal space for Iluminada &amp; George\'s wedding. 
        From here you can share in the planning, keep your details up to date, 
        and help us make the celebration feel just right for you and your party.
      </p>
      <p>
        In this area you can update the names of everyone in your party, tell us about any food allergies 
        or special dietary needs, confirm who will attend each of the wedding events, 
        choose your preferred courses and drinks for the banquet, send messages to other guests 
        and, if you wish, select a gift for us from the wedding registry.  
        We\'re so happy to be celebrating this with you. ❤️
      </p>
    `,
    'guests:summaryYourParty': 'Your Party',
    'guests:summaryRSVP': 'RSVP Summary',
    'guests:summaryMenuSelections': 'Menu Selections',

    'guests:loadingPartyMembers': 'Loading party members...',
    'guests:loadingComments': 'Loading comments...',
    'guests:partyManagement': 'Party Management',
    'rich:guests:partyManagementDesc': 'Manage your wedding party members and their dietary requirements.',
    'guests:giftsSelection': 'Gifts Selection',
    'rich:guests:giftsSelectionDesc': 'Choose your favorite gifts for our wedding celebrations.',
    'guests:eventsRSVP': 'RSVP',
    'rich:guests:eventsRSVPDesc': 'The celebrations will take place over three days: Friday, Saturday and Sunday. They kick off on Friday with a welcome dinner.   Saturday is a full day of activities including the wedding ceremony, the reception banquet, and dancing.   Sunday\'s activities include a farewell brunch.  Please confirm your attendance for which ever of these events you will be attending.',

    // Party Page
    'guests:party.page.title': 'Party Management',
    'guests:party.page.description': 'Manage your wedding party members and their dietary requirements.',
    'guests:partyMembersSaved': 'Party members saved successfully!',
    'guests:errorSavingPartyMembers': 'Error saving party members',
    'rich:guests:savePartyMembers': '<i class="fas fa-save"></i> Save Party Members',
    'rich:guests:partyMembersTitle': '<i class="fas fa-users"></i> Party Members',
    'guests:partyDescription': 'Your party includes everyone who will attend the wedding with you. You can add up to {{maxPartySize}} party members including yourself.',
    'rich:guests:addPartyMember': '<i class="fas fa-plus-circle"></i> Add Party Member',
    'rich:guests:dietaryRequirements': '<i class="fas fa-utensils"></i> Dietary Requirements',
    'guests:dietaryDescription': 'Please let us know about any dietary requirements or allergies for each party member.',
    'guests:dietaryRequirementsSaved': 'Dietary requirements saved successfully!',
    'common:errorSavingDietaryRequirements': 'Error saving dietary requirements',
    
    // Events Page
    'guests:eventsPageTitle': 'RSVP to the Wedding Events below',
    'guests:eventsPageDescription': 'We are thrilled to have to have you join us for the wedding. Here are the details of all the events that will be taking place. Please select your name in each event in the Who\'s Attending section. That way we can prepare everything for you to have a great time.',

    'guests:eventsLoading': 'Loading events...',
    'guests:eventsNoEvents': 'No Events Available',
    'guests:eventsNoEventsDescription': 'There are no events scheduled yet. Please check back later.',
    'guests:eventsNoPartyMembers': 'No party members found.',
    'guests:eventsViewOnMap': 'View on Map',
    'guests:eventsWhosAttending': 'Who\'s Attending?',
    'guests:eventsErrorTitle': 'Error Loading Events',
    'guests:eventsErrorMessage': 'There was a problem loading the events. Please try again.',
    'guests:eventsSchedule': 'Schedule',
    'guests:childBadge': 'Child',
    'guests:eventsAttendanceSavedSuccess': 'Attendance choices saved successfully!',
    'guests:eventsAttendanceSavedError': 'Error saving attendance choices',
    'guests:eventsSaveAttendanceChoices': 'Save Attendance Choices',
    'guests:logout': 'Logout',
    'guests:event': 'Event',

    // Menu Page
    'guests:menuPageTitle': 'Menu Selection',
    'guests:menuPageDescription': 'Choose your preferred dishes for the wedding banquet.',
    'guests:menuSelection': 'Menu Selection',
    'guests:menuSelectionDesc': 'Your current menu selection for our wedding.',
    'guests:menuSelectionDesc2': 'Choose your preferred dishes for our wedding.',
    'guests:yourSummary': 'Your Summary',


    // Comments Page
    'guests:commentsTitle': 'Comments',
    'rich:guests:commentsSubtitle': 'Share your thoughts with other guests',
    'rich:guests:commentPlaceholder': `
      <textarea
        id="newComment"
        name="comment"
        placeholder="Write your comment..."
        rows="3"
        maxlength="500"
      ></textarea>
     `,
    'guests:postComment': 'Post',

    'guests:welcome': 'Welcome',
    
    // Menu Selection Page
    'guests:menuLoading': 'Loading menu...',
    'guests:menuErrorTitle': 'Error Loading Menu',
    'guests:menuErrorMessage': 'Unable to load menu data. Please try again later.',
    'guests:menuErrorMessage2': 'There was a problem loading the menu. Please try again.',
    'guests:retry': 'Retry',
    'guests:courseGroupStarters': 'Starters',
    'guests:courseGroupMainCourses': 'Main Courses',
    'guests:courseGroupDesserts': 'Desserts',
    'guests:courseGroupDrinks': 'Drinks',
    'guests:selectionRequired': 'Selection Required',
    'guests:infoOnly': 'Info Only',
    'guests:whosHavingThis': 'Who\'s having this?',
    'guests:selectedCount': 'selected',
    'guests:dietaryRequirementsTitle': 'Dietary Requirements & Special Requests',
    'guests:dietaryRequirementsDescription': 'Please let us know about any dietary requirements or allergies for each guest.',
    'guests:dietaryVegetarian': 'Vegetarian',
    'guests:dietaryLactose Intolerant': 'Lactose Intolerant',
    'guests:dietaryGluten Intolerant': 'Gluten Intolerant',
    'guests:dietaryNut Allergy': 'Nut Allergy',
    'guests:dietaryOther': 'Other',
    'guests:additionalDetailsLabel': 'Additional details or specific requirements:',
    'guests:additionalDetailsPlaceholder': 'Please describe any specific dietary needs, allergies, or special requirements...',
    'guests:saveMenuSelections': 'Save Menu Selections',
    'rich:guests:saveDietaryRequirements': '<i class="fas fa-save"></i> Save Dietary Requirements',
    
    // Gifts Page
    'guests:giftsPageTitle': 'Gifts list',
    'guests:giftsPageDescription': 'Your presence is our gift. But if you want to contribute to our honeymoon you can choose an amusing gift from the list below and it will be printed with your message and displayed on a big wall at the wedding banquet.  The cash amount you choose will be used to fund our honeymoon.  Thank you',
    'guests:giftsLoading': 'Loading gifts...',
    'guests:giftsThankYouTitle': 'Thank You for Your Generosity!',
    'guests:giftsThankYouMessage': 'We are so grateful for your wonderful gifts',
    'rich:guests:giftsDonatedOn': 'Donated on {{date}}',
    'guests:giftsRegistryTitle': 'Gift Registry',
    'guests:giftsRegistrySubtitle': 'Choose from our carefully selected gifts',
    'guests:giftsNoAvailable': 'No gifts available',
    'guests:giftsNoAvailableDescription': 'Please check back later for our gift registry.',
    'guests:giftsAvailable': 'available',
    'guests:giftsSoldOut': 'Sold Out',
    'guests:giftsBuyGift': 'Buy Gift',
    'guests:giftsPaymentSuccess': 'Thank you for your gift! Your payment was successful.',
    'guests:giftsPaymentCancelled': 'Payment was cancelled.',
    'guests:giftsErrorLoading': 'Error Loading Gifts',
    'guests:giftsErrorLoadingDescription': 'There was a problem loading the gifts. Please try again.',
    'guests:giftsRetry': 'Retry',
    'guests:giftsPurchaseTitle': 'Purchase Gift',
    'guests:giftsPurchaseAbout': 'You\'re about to purchase:',
    'guests:giftsPurchaseMessageLabel': 'Add a personal message (optional):',
    'guests:giftsPurchaseMessagePlaceholder': 'Leave a lovely message for the couple...',
    'guests:giftsPurchaseCancel': 'Cancel',
    'guests:giftsPurchaseProceed': 'Proceed to Payment',
    'guests:giftsPurchaseProcessing': 'Processing...',
    'guests:giftsPaymentError': 'Error processing payment',
    'guests:giftsPaymentServiceError': 'Error connecting to payment service',


    // Admin
    'admin:pageTitle': 'Admin Panel - Wedding of Iluminada & George',
    'admin:title': 'Admin Panel',
    'admin:logout': 'Log out',
    'admin:welcomeTitle': 'Welcome, Administrator',
    'admin:welcomeDesc': 'Manage all wedding information for Iluminada and George',
    'admin:tab.guests': 'Guests',
    'admin:tab.gifts': 'Gift List',
    'admin:tab.messages': 'Messages',
    'admin:tab.events': 'Event Schedule',
    'admin:tab.menus': 'Menu Management',
    'admin:tab.settings': 'Settings',
    'admin:loading': 'Loading...',
    'admin:uploadingGuests': 'Uploading guests...',
    'admin:loadingPartyMembers': 'Loading party members...',
    'admin:loadingGiftList': 'Loading gift list...',
    'admin:loadingMessages': 'Loading messages...',
    'admin:loadingEventSchedule': 'Loading event schedule...',
    'admin:loadingCourses': 'Loading courses...',
    'admin:loadingSettings': 'Loading settings...',
    'admin:footer': 'Admin panel',

    // Admin Messages Section
    'admin:messages.title': 'Messages Cleanup',
    'admin:messages.subtitle': 'Delete any guest messages that are inappropriate or offensive',
    'admin:messages.noMessages': 'No messages yet. Guests will appear here when they post comments.',
    'admin:messages.loading': 'Loading messages...',
    'admin:messages.errorTitle': 'Error Loading Messages',
    'admin:messages.errorMessage': 'Failed to load messages: {{error}}',
    'admin:messages.retry': 'Retry',
    'admin:messages.delete': 'Delete',

    // Admin Guests Section
    'admin:guests.errorLoading': 'Failed to load guests',
    'admin:guests.adult': 'Adult',
    'admin:guests.child': 'Child',
    'admin:guests.totalGuests': 'Total Guests',
    'admin:guests.acrossParties': 'Across {{count}} {{partyWord}}',
    'admin:guests.addGuest': 'Add Guest',
    'admin:guests.bulkUploadCsv': 'Bulk Upload CSV',
    'admin:guests.table.email': 'Email',
    'admin:guests.table.partySize': 'Party Size',
    'admin:guests.table.actions': 'Actions',
    'admin:guests.confirmDelete': 'Delete this guest and their entire party?',
    'admin:guests.editTitle': 'Edit guest',
    'admin:guests.addTitle': 'Add guest',
    'admin:guests.save': 'Save',
    'admin:guests.add': 'Add',
    'admin:guests.field.name': 'Name',
    'admin:guests.field.email': 'Email',
    'admin:guests.field.ageCategory': 'Age Category',
    'admin:guests.option.adult': 'Adult (18+)',
    'admin:guests.option.child': 'Child (Under 18)',
    'admin:guests.csv.noValidGuests': 'No valid guests found in CSV file',
    'admin:guests.csv.uploadCount': 'Upload {{count}} guests?',
    'admin:guests.csv.preview': 'Preview:',
    'admin:guests.csv.more': '... and {{count}} more',
    'admin:guests.csv.uploadComplete': 'Upload complete!',
    'admin:guests.csv.successCreated': 'Successfully created: {{count}}',
    'admin:guests.csv.skippedDuplicates': 'Skipped (duplicates/empty): {{count}}',
    'admin:guests.csv.errors': 'Errors: {{count}}',
    'admin:guests.csv.firstError': 'First error: {{error}}',
    'admin:guests.csv.uploadingError': 'Error uploading CSV: {{error}}',
    'admin:guests.error.title': 'Error Loading Guests',
    'admin:guests.error.failed': 'Failed to load guests: {{error}}',
    'admin:guests.retry': 'Retry',

    // Admin Gifts Section
    'admin:gifts.title': 'Gift List',
    'admin:gifts.add': 'Add',
    'admin:gifts.edit': 'Edit gift',
    'admin:gifts.save': 'Save',
    'admin:gifts.deleteConfirm': 'Delete this gift?',
    'admin:gifts.noImage': 'No image',
    'admin:gifts.grandTotal': 'Grand Total',
    'admin:gifts.grandTotalDescription': 'The available cards x price',
    'admin:gifts.table.description': 'Description',
    'admin:gifts.table.image': 'Image',
    'admin:gifts.table.available': 'Available',
    'admin:gifts.table.price': 'Price',
    'admin:gifts.table.purchased': 'Purchased',
    'admin:gifts.table.actions': 'Actions',
    'admin:gifts.field.title': 'Name',
    'admin:gifts.field.description': 'Description',
    'admin:gifts.field.image': 'Image',
    'admin:gifts.field.available': 'Number Available',
    'admin:gifts.field.price': 'Price',
    'admin:gifts.field.imageHelp': 'Upload gift card image (will be stored in database)',
    'admin:gifts.priceOption.25': '€25',
    'admin:gifts.priceOption.50': '€50',
    'admin:gifts.priceOption.100': '€100',
    'admin:gifts.priceOption.200': '€200',
    'admin:gifts.priceOption.500': '€500',

    // Admin Settings Section
    'admin:settings.title': 'Settings',
    'admin:settings.featureToggles': 'Feature Toggles',
    'admin:settings.featureTogglesDescription': 'Control which features are available to guests',
    'admin:settings.enableGuestArea': 'Enable Guest Area',
    'admin:settings.enableGuestAreaDesc': 'Allow guests to login and manage guests in their party',
    'admin:settings.showWeddingEvents': 'Show Wedding Events',
    'admin:settings.showWeddingEventsDesc': 'Show the wedding event calendar and allow guests to confirm their attendance',
    'admin:settings.menu': 'Menu',
    'admin:settings.menuDesc': 'Show Guest Menu selection and Preferences',
    'admin:settings.messages': 'Messages',
    'admin:settings.messagesDesc': 'Show Messages',
    'admin:settings.gifts': 'Gifts',
    'admin:settings.giftsDesc': 'Show Gift Registry',

    // Admin Party Management Section
    'admin:party.title': 'Manage Party: ',
    'admin:party.description': 'Manage party members for this guest',
    'admin:party.backToGuests': 'Back to Guests',
    'admin:party.unknown': 'Unknown',
    'admin:party.partyMembers': 'Party Members',
    'admin:party.addMember': 'Add Member',
    'admin:party.noMembers': 'No party members added yet.',
    'admin:party.table.name': 'Name',
    'admin:party.table.ageGroup': 'Age Group',
    'admin:party.table.actions': 'Actions',
    'admin:party.addModalTitle': 'Add Party Member',
    'admin:party.add': 'Add',
    'admin:party.field.name': 'Name',
    'admin:party.field.ageGroup': 'Age Group',
    'admin:party.option.adult': 'Adult (18+)',
    'admin:party.option.child': 'Child (Under 18)',
    'admin:party.editModalTitle': 'Edit Party Member',
    'admin:party.save': 'Save',
    'admin:party.confirmRemove': 'Remove this party member?',
    'admin:party.error.title': 'Error Loading Party',
    'admin:party.error.failed': 'Failed to load party members: {{error}}',
    'admin:party.error.loadFailed': 'Failed to load party members',
    'admin:party.error.addFailed': 'Failed to add party member',
    'admin:party.error.removeFailed': 'Failed to remove party member',
    'admin:party.error.updateFailed': 'Failed to update party member',
    'admin:party.error.loadingError': 'Error loading party members: {{error}}',
    'admin:party.retry': 'Retry',

    // Admin Events Section
    'admin:events.title': 'Event Schedule',
    'admin:events.addEvent': 'Add Event',
    'admin:events.noImage': 'No image',
    'admin:events.confirmDelete': 'Delete this event?',
    'admin:events.errorDeleting': 'Error deleting event',
    'admin:events.modal.addTitle': 'Add Event',
    'admin:events.modal.editTitle': 'Edit Event',
    'admin:events.add': 'Add',
    'admin:events.save': 'Save',
    'admin:events.table.name': 'Name',
    'admin:events.table.date': 'Date',
    'admin:events.table.startTime': 'Start Time',
    'admin:events.table.endTime': 'End Time',
    'admin:events.table.title': 'Title',
    'admin:events.table.image': 'Image',
    'admin:events.table.actions': 'Actions',
    'admin:events.field.name': 'Name',
    'admin:events.field.nameHelp': 'e.g. Wedding Ceremony',
    'admin:events.field.date': 'Date',
    'admin:events.field.dateHelp': 'Event date (Spain locale)',
    'admin:events.field.startTime': 'Start Time',
    'admin:events.field.startTimeHelp': 'Start time (24h format)',
    'admin:events.field.endDate': 'End Date',
    'admin:events.field.endDateHelp': 'End date (optional, for events that span multiple days)',
    'admin:events.field.endTime': 'End Time',
    'admin:events.field.endTimeHelp': 'End time (24h format, can be next day if end date is set)',
    'admin:events.field.location': 'Location',
    'admin:events.field.locationHelp': 'Use map tool to select precise location',
    'admin:events.field.title': 'Title',
    'admin:events.field.titleHelp': 'e.g. Oyana Beach Restaurant',
    'admin:events.field.description': 'Description',
    'admin:events.field.descriptionHelp': 'Event description or additional details',
    'admin:events.field.image': 'Image',
    'admin:events.field.imageHelp': 'Upload event image (will be stored in database)',
    'admin:events.error.create': 'Failed to create event',
    'admin:events.error.update': 'Failed to update event',

    // Admin Sub-events Section
    'admin:subEvents.manageTitle': 'Manage Sub-events: {{eventName}}',
    'admin:subEvents.close': 'Close',
    'admin:subEvents.addSubEvent': 'Add Sub-event',
    'admin:subEvents.noSubEvents': 'No sub-events yet',
    'admin:subEvents.deleteConfirm': 'Delete this sub-event?',
    'admin:subEvents.addTitle': 'Add Sub-event',
    'admin:subEvents.editTitle': 'Edit Sub-event',
    'admin:subEvents.add': 'Add',
    'admin:subEvents.save': 'Save',
    'admin:subEvents.field.name': 'Name',
    'admin:subEvents.field.nameHelp': 'e.g. Welcome Cocktails',
    'admin:subEvents.field.date': 'Date',
    'admin:subEvents.field.startTime': 'Start Time',
    'admin:subEvents.field.endTime': 'End Time',
    'admin:subEvents.field.description': 'Description',
    'admin:subEvents.field.descriptionHelp': 'e.g. Enjoy cocktails and hor d\'oeuvres by the fountain while meeting other attendees',
    'admin:subEvents.field.icon': 'Icon',
    'admin:subEvents.option.ceremony': 'Ceremony',
    'admin:subEvents.option.cocktails': 'Cocktails',
    'admin:subEvents.option.reception': 'Reception',
    'admin:subEvents.option.dancing': 'Dancing',

    // Admin Menu Management Section
    'admin:menu.title': 'Menu Management',
    'admin:menu.courseType.starter': 'Starters',
    'admin:menu.courseType.main': 'Main Courses',
    'admin:menu.courseType.dessert': 'Desserts',
    'admin:menu.courseType.drinks': 'Drinks',
    'admin:menu.noOptionsDefined': 'No options defined',
    'admin:menu.emptyCourse': 'No {{courseType}} defined yet.',
    'admin:menu.errorLoading': 'Error Loading Menu',
    'admin:menu.failedToLoad': 'Failed to load menu: {{error}}',
    'admin:menu.retry': 'Retry',
    'admin:menu.confirmDelete': 'Delete this menu part? This will remove all its options.',
    'admin:menu.confirmDeleteOption': 'Delete this menu option?',
    'admin:menu.errorDeleting': 'Error deleting menu part',
    'admin:menu.errorDeletingOption': 'Error deleting menu option',
    'admin:menu.editCourse': 'Edit Course',
    'admin:menu.addCourse': 'Add Course',
    'admin:menu.save': 'Save',
    'admin:menu.add': 'Add',
    'admin:menu.field.courseType': 'Course Type',
    'admin:menu.field.courseLabel': 'Course Label',
    'admin:menu.field.selectionRequired': 'Selection Required',
 
    
    'admin:menu.option.starter': 'Starter',
    'admin:menu.option.main': 'Main Course',
    'admin:menu.option.dessert': 'Dessert',
    'admin:menu.option.drinks': 'Drinks',
    'admin:menu.option.yes': 'Yes - Guests must choose one option',
    'admin:menu.option.no': 'No - All options will be provided',
    'admin:menu.field.courseLabelHelp': 'e.g. "Appetizers", "Main Dish", "Desserts"',

    'admin:menu.field.helpSelectionRequired': 'If enabled, guests must select one option. If disabled, all options will be provided.',
    'admin:menu.editCourseOption': 'Edit Course Option',
    'admin:menu.addCourseOption': 'Add Course Option',
    'admin:menu.field.option': 'Option',
    'admin:menu.field.optionHelp': 'e.g. Cream of Mushroom Soup',
    'admin:menu.field.optionDescription': 'Option Description',
    'admin:menu.field.optionDescriptionHelp': 'e.g. A delicate blend of cream, mushrooms, and garlic',
    'admin:menu.field.option': 'Option',
    'admin:menu.field.optionDescription': 'Option Description',
    'admin:menu.field.image': 'Image',
    'admin:menu.field.imageHelp': 'Upload menu option image (will be stored in database)',
    'admin:menu.field.isVegetarian': 'Vegetarian',
    'admin:menu.field.containsAllergens': 'Contains Allergens',
    'admin:menu.field.containsLactose': 'Contains Lactose',
    'admin:menu.field.isSpicy': 'Spicy',
    'admin:menu.field.containsNuts': 'Contains Nuts',
    'admin:menu.field.helpVegetarian': 'This option is suitable for vegetarians',
    'admin:menu.field.helpAllergens': 'This option contains allergens - please check ingredient list',
    'admin:menu.field.helpLactose': 'This option contains lactose/dairy products',
    'admin:menu.field.helpSpicy': 'This option contains spicy ingredients',
    'admin:menu.field.helpNuts': 'This option may contain nuts',

    'adminLogin:pageTitle': 'Admin Login - Wedding of Iluminada & George',
    'adminLogin:subHeader': 'Access the Admin Panel',
    'adminLogin:description': 'Enter your credentials to manage wedding details and RSVPs.',
    'adminLogin:username': 'Username',
    'adminLogin:usernamePlaceholder': 'Your username',
    'adminLogin:password': 'Password',
    'adminLogin:passwordPlaceholder': 'Your secret password',
    'adminLogin:submit': 'Sign in',

    'common:advancedFeatures': 'Advanced Features Examples',
    'common:numberFormatting': 'Number Formatting',
    'common:price': 'Price',
    'common:percentage': 'Percentage',
    'common:dateFormatting': 'Date Formatting',
    'common:currentDate': 'Current Date',
    'common:currentTime': 'Current Time',
    'common:currencyFormatting': 'Currency Formatting',
    'common:gift': 'Gift',
  },
  es: {
    'common:home': 'Inicio',
    'common:days': 'Días',
    'common:hours': 'Horas',
    'common:minutes': 'Minutos',
    'common:seconds': 'Segundos',
    'rich:wedding.common.footer': '© 2026 Boda de Iluminada &amp; George',
    'common:party.primary.guest': 'Invitado principal',
    'common:party.adult': 'Adulto (18+)',
    'common:party.child': 'Niño',
    'common:party.members': 'miembros',
    'common:party.name': 'Nombre',
    'common:party.age.category': 'Edad',
    'rich:common:new': '<i class="fas fa-plus-circle"></i> Nuevo',
    'common:party.remove.member': 'Eliminar miembro',
    'common:enter.name': 'Introduce el nombre...', 
    'rich:common:confirmAction': 'Confirmar acción',
    'rich:common:cancel': 'Cancelar',
    'rich:common:confirm': 'Confirmar',

    'common:party.primary': 'Principal',
    'common:menu.saving': 'Guardando...',
    'common:menu.selections.saved': 'Selecciones de menú guardadas correctamente.',
    'common:error.saving.menu.selections': 'Error al guardar las selecciones de menú',
    'common:menu.selection.saved': 'Selección de menú guardada correctamente.',
    'common:error.saving.menu.selection': 'Error al guardar la selección de menú',
    'common:menu.special.request.saved': 'Petición especial guardada correctamente.',
    'common:error.saving.special.request': 'Error al guardar la petición especial',
    'common:menu.special.request.details.saved': 'Detalles de la petición especial guardados correctamente.',
    'common:error.saving.special.request.details': 'Error al guardar los detalles de la petición especial',
    'common:people': 'personas',
    'common:person': 'persona',
    'common:party.confirm.remove.member': '¿Estás seguro de querer eliminar a {{memberName}} de tu grupo?',
 
    'wedding:title': 'Iluminada & George',
    'wedding:subtitle': '¡Nos casamos!',
    'wedding:date': '6 de junio de 2026 • Marbella, España',
    'wedding:hero.description': 'Iluminada y George se casan en la playa de Marbella este junio y estamos muy felices de compartirlo contigo. Te esperan sol, mar y muchas risas.',
    'wedding:hero.description2': 'Este sitio es tu centro para la boda. Inicia sesión con el correo de tu RSVP para confirmar tu grupo, elegir tu menú, ver el programa, consultar nuestra lista de regalos y chatear con otros invitados.',

    'login:guest.zone.title': 'Zona de invitados',

    'login:page.title': 'Acceso de invitados - Boda',
    'login:header': 'Acceso de invitados',
    'login:email.label': 'Correo electrónico:',
    'login:email.placeholder': 'Introduce tu correo electrónico',
    'login:submit': 'Continuar',
    'login:enter.email': 'Por favor, introduce tu correo electrónico.',
    'login:success.redirecting': 'Acceso correcto. Redirigiendo...',
    'login:email.not.found': 'El correo no figura en la lista de invitados',
    'login:server.error': 'Error de conexión con el servidor',

    'guests:title': 'Zona de invitados - Boda de Iluminada y George',
    'guests:welcome.title': 'Zona de invitados',
    'guests:summary': 'Resumen',
    'guests:menu': 'Menú',

    'guests:rsvp': 'RSVP',

    'guests:menuSelection': 'Selección de menú',
    'guests:menuSelectionDesc': 'Tu selección de menú actual para nuestra boda.',
    'guests:menuSelectionDesc2': 'Elige tus platos preferidos para nuestra boda.',
    'guests:party': 'Grupo',
    'guests:yourSummary': 'Tu resumen',

    // Summary Page
    'guests:summaryPageTitle': 'Tu área de invitado para la boda de Iluminada y George',
    'rich:guests:summaryPageDescription': `
      <p>
        Bienvenido/a a tu espacio personal para la boda de Iluminada &amp; George. 
        Desde aquí puedes participar en los preparativos, mantener tus datos actualizados 
        y ayudarnos a que la celebración sea perfecta para ti y tu grupo.
      </p>
      <p>
        En esta área puedes actualizar los nombres de todas las personas de tu grupo, contarnos cualquier alergia alimentaria 
        o necesidad dietética especial, confirmar quién asistirá a cada uno de los eventos de la boda, 
        elegir tus platos y bebidas preferidos para el banquete, enviar mensajes a otros invitados 
        y, si lo deseas, elegir un regalo para nosotros de la lista de bodas.  
        Estamos muy felices de celebrar esto contigo. ❤️
      </p>
    `,
    'guests:summaryYourParty': 'Tu grupo',
    'guests:summaryRSVP': 'Resumen de asistencia',
    'guests:summaryMenuSelections': 'Selecciones de menú',

    'guests:loadingPartyMembers': 'Cargando miembros del grupo...',
    'guests:loadingComments': 'Cargando comentarios...',
    'guests:partyManagement': 'Gestión del grupo',
    'rich:guests:partyManagementDesc': 'Gestiona los miembros de tu grupo y sus requisitos dietéticos.',
    'guests:giftsSelection': 'Selección de regalos',
    'rich:guests:giftsSelectionDesc': 'Elige tus regalos favoritos para nuestras celebraciones de boda.',
    'guests:eventsRSVP': 'RSVP',
    'rich:guests:eventsRSVPDesc': 'Las celebraciones tendrán lugar durante tres días: viernes, sábado y domingo. Empiezan el viernes con una cena de bienvenida. El sábado será un día completo de actividades, incluida la ceremonia de la boda, el banquete y el baile. El domingo terminaremos con un brunch de despedida. Por favor, confirma en cuáles de estos eventos vas a asistir.',

    // Party Page
    'guests:party.page.title': 'Gestión del grupo',
    'guests:party.page.description': 'Gestiona los miembros de tu grupo y sus requisitos dietéticos.',
    'rich:guests:savePartyMembers': '<i class="fas fa-save"></i> Guardar miembros del grupo',
    'rich:guests:partyMembersTitle': '<i class="fas fa-users"></i> Miembros del grupo',
    'guests:partyDescription': 'Tu grupo incluye a todos los que asistirán a la boda contigo. Puedes añadir hasta {{maxPartySize}} miembros de grupo incluyéndote a ti mismo.',
    'guests:partyMembersSaved': 'Miembros del grupo guardados correctamente!',
    'guests:errorSavingPartyMembers': 'Error al guardar los miembros del grupo',
    'rich:guests:addPartyMember': '<i class="fas fa-plus-circle"></i> Añadir miembro del grupo',
    'rich:guests:dietaryRequirements': '<i class="fas fa-utensils"></i> Requisitos dietéticos',
    'guests:dietaryDescription': 'Por favor, infórmanos sobre cualquier requisito dietético o alergia de cada miembro de tu grupo.',
    'guests:dietaryRequirementsSaved': 'Requisitos dietéticos guardados correctamente!',
    'common:errorSavingDietaryRequirements': 'Error al guardar los requisitos dietéticos',

    // Events Page
    'guests:eventsPageTitle': 'Confirma tu asistencia a los eventos de la boda de abajo',
    'guests:eventsPageDescription': 'Nos hace mucha ilusión que nos acompañes en la boda. Aquí tienes los detalles de todos los eventos que tendrán lugar. Por favor, selecciona tu nombre en cada evento en la sección "Quién asiste". Así podremos preparar todo para que lo pases genial.',

    'guests:eventsLoading': 'Cargando eventos...',
    'guests:eventsNoEvents': 'No hay eventos disponibles',
    'guests:eventsNoEventsDescription': 'Todavía no hay eventos programados. Por favor, vuelve a comprobar más tarde.',
    'guests:eventsNoPartyMembers': 'No se han encontrado miembros de grupo.',
    'guests:eventsViewOnMap': 'Ver en el mapa',
    'guests:eventsWhosAttending': '¿Quién asiste?',
    'guests:eventsErrorTitle': 'Error al cargar los eventos',
    'guests:eventsErrorMessage': 'Ha habido un problema al cargar los eventos. Por favor, inténtalo de nuevo.',
    'guests:eventsSchedule': 'Programa',
    'guests:childBadge': 'Niño',
    'guests:eventsAttendanceSavedSuccess': 'Opciones de asistencia guardadas correctamente.',
    'guests:eventsAttendanceSavedError': 'Error al guardar las opciones de asistencia',
    'guests:eventsSaveAttendanceChoices': 'Guardar opciones de asistencia',
    'guests:logout': 'Cerrar sesión',
    'guests:event': 'Evento',

    // Menu Page
    'guests:menuPageTitle': 'Selección de menú',
    'guests:menuPageDescription': 'Elige tus platos preferidos para el banquete de la boda.',

    // Comments Page
    'guests:commentsTitle': 'Comentarios',
    'rich:guests:commentsSubtitle': 'Comparte tus pensamientos con otros invitados',
    'rich:guests:commentPlaceholder': `
      <textarea
        id="newComment"
        name="comment"
        placeholder="Escribe tu comentario..."
        rows="3"
        maxlength="500"
      ></textarea>
     `,
    'guests:postComment': 'Publicar',

    'guests:welcome': 'Bienvenido/a',
    
    // Menu Selection Page
    'guests:menuLoading': 'Cargando menú...',
    'guests:menuErrorTitle': 'Error al cargar el menú',
    'guests:menuErrorMessage': 'No se pueden cargar los datos del menú. Por favor, inténtalo de nuevo más tarde.',
    'guests:menuErrorMessage2': 'Ha habido un problema al cargar el menú. Por favor, inténtalo de nuevo.',
    'guests:retry': 'Reintentar',
    'guests:courseGroupStarters': 'Entrantes',
    'guests:courseGroupMainCourses': 'Platos principales',
    'guests:courseGroupDesserts': 'Postres',
    'guests:courseGroupDrinks': 'Bebidas',
    'guests:selectionRequired': 'Selección obligatoria',
    'guests:infoOnly': 'Solo información',
    'guests:whosHavingThis': '¿Quién va a tomar esto?',
    'guests:selectedCount': 'seleccionados',
    'guests:dietaryRequirementsTitle': 'Requisitos dietéticos y peticiones especiales',
    'guests:dietaryRequirementsDescription': 'Por favor, indícanos cualquier requisito dietético o alergia de cada invitado.',
    'guests:dietaryVegetarian': 'Vegetariano',
    'guests:dietaryLactose Intolerant': 'Intolerancia a la lactosa',
    'guests:dietaryGluten Intolerant': 'Intolerancia al gluten',
    'guests:dietaryNut Allergy': 'Alergia a los frutos secos',
    'guests:dietaryOther': 'Otro',
    'guests:additionalDetailsLabel': 'Detalles adicionales o requisitos específicos:',
    'guests:additionalDetailsPlaceholder': 'Por favor, describe cualquier requisito dietético o preferencia específica...',
    'guests:saveMenuSelections': 'Guardar selecciones de menú',
    'rich:guests:saveDietaryRequirements': '<i class="fas fa-save"></i> Guardar requisitos dietéticos',
    
    // Gifts Page
    'guests:giftsPageTitle': 'Lista de regalos',
    'guests:giftsPageDescription': 'Tu presencia es nuestro regalo. Pero si quieres contribuir a nuestra luna de miel, puedes elegir un regalo divertido de la lista de abajo; se imprimirá con tu mensaje y se mostrará en un gran panel en el banquete de boda. El importe que elijas se utilizará para financiar nuestra luna de miel. ¡Gracias!',
    'guests:giftsLoading': 'Cargando regalos...',
    'guests:giftsThankYouTitle': '¡Gracias por tu generosidad!',
    'guests:giftsThankYouMessage': 'Estamos muy agradecidos por tus maravillosos regalos',
    'rich:guests:giftsDonatedOn': 'Donado el {{date}}',
    'guests:giftsRegistryTitle': 'Lista de regalos',
    'guests:giftsRegistrySubtitle': 'Elige entre nuestros regalos seleccionados con cariño',
    'guests:giftsNoAvailable': 'No hay regalos disponibles',
    'guests:giftsNoAvailableDescription': 'Por favor, vuelve a consultar más tarde nuestra lista de regalos.',
    'guests:giftsAvailable': 'disponibles',
    'guests:giftsSoldOut': 'Agotado',
    'guests:giftsBuyGift': 'Comprar regalo',
    'guests:giftsPaymentSuccess': '¡Gracias por tu regalo! El pago se ha realizado correctamente.',
    'guests:giftsPaymentCancelled': 'El pago se ha cancelado.',
    'guests:giftsErrorLoading': 'Error al cargar los regalos',
    'guests:giftsErrorLoadingDescription': 'Ha habido un problema al cargar los regalos. Por favor, inténtalo de nuevo.',
    'guests:giftsRetry': 'Reintentar',
    'guests:giftsPurchaseTitle': 'Comprar regalo',
    'guests:giftsPurchaseAbout': 'Vas a comprar:',
    'guests:giftsPurchaseMessageLabel': 'Añade un mensaje personal (opcional):',
    'guests:giftsPurchaseMessagePlaceholder': 'Deja un mensaje bonito para la pareja...',
    'guests:giftsPurchaseCancel': 'Cancelar',
    'guests:giftsPurchaseProceed': 'Continuar al pago',
    'guests:giftsPurchaseProcessing': 'Procesando...',
    'guests:giftsPaymentError': 'Error al procesar el pago',
    'guests:giftsPaymentServiceError': 'Error al conectar con el servicio de pagos',
    'guests:gifts': 'Regalos',


    // Admin
    'admin:pageTitle': 'Panel de administración - Boda de Iluminada y George',
    'admin:title': 'Panel de administración',
    'admin:logout': 'Cerrar sesión',
    'admin:welcomeTitle': 'Bienvenido/a, administrador',
    'admin:welcomeDesc': 'Administra toda la información de la boda de Iluminada y George',
    'admin:tab.guests': 'Invitados',
    'admin:tab.gifts': 'Lista de regalos',
    'admin:tab.messages': 'Mensajes',
    'admin:tab.events': 'Programa de eventos',
    'admin:tab.menus': 'Gestión del menú',
    'admin:tab.settings': 'Configuración',
    'admin:loading': 'Cargando...',
    'admin:uploadingGuests': 'Subiendo invitados...',
    'admin:loadingPartyMembers': 'Cargando miembros del grupo...',
    'admin:loadingGiftList': 'Cargando lista de regalos...',
    'admin:loadingMessages': 'Cargando mensajes...',
    'admin:loadingEventSchedule': 'Cargando programa de eventos...',
    'admin:loadingCourses': 'Cargando platos...',
    'admin:loadingSettings': 'Cargando configuración...',
    'admin:footer': 'Panel de administración',

    // Admin Messages Section
    'admin:messages.title': 'Limpieza de mensajes',
    'admin:messages.subtitle': 'Elimina cualquier mensaje de invitados que sea inapropiado u ofensivo',
    'admin:messages.noMessages': 'Todavía no hay mensajes. Los invitados aparecerán aquí cuando publiquen comentarios.',
    'admin:messages.loading': 'Cargando mensajes...',
    'admin:messages.errorTitle': 'Error al cargar los mensajes',
    'admin:messages.errorMessage': 'No se pudieron cargar los mensajes: {{error}}',
    'admin:messages.retry': 'Reintentar',
    'admin:messages.delete': 'Eliminar',

    // Admin Guests Section
    'admin:guests.errorLoading': 'No se pudieron cargar los invitados',
    'admin:guests.adult': 'Adulto',
    'admin:guests.child': 'Niño',
    'admin:guests.totalGuests': 'Total de invitados',
    'admin:guests.acrossParties': 'En {{count}} {{partyWord}}',
    'admin:guests.addGuest': 'Añadir invitado',
    'admin:guests.bulkUploadCsv': 'Subir CSV masivo',
    'admin:guests.table.email': 'Correo electrónico',
    'admin:guests.table.partySize': 'Tamaño del grupo',
    'admin:guests.table.actions': 'Acciones',
    'admin:guests.confirmDelete': '¿Eliminar este invitado y todo su grupo?',
    'admin:guests.editTitle': 'Editar invitado',
    'admin:guests.addTitle': 'Añadir invitado',
    'admin:guests.save': 'Guardar',
    'admin:guests.add': 'Añadir',
    'admin:guests.field.name': 'Nombre',
    'admin:guests.field.email': 'Correo electrónico',
    'admin:guests.field.ageCategory': 'Categoría de edad',
    'admin:guests.option.adult': 'Adulto (18+)',
    'admin:guests.option.child': 'Niño (menor de 18)',
    'admin:guests.csv.noValidGuests': 'No se han encontrado invitados válidos en el archivo CSV',
    'admin:guests.csv.uploadCount': '¿Subir {{count}} invitados?',
    'admin:guests.csv.preview': 'Vista previa:',
    'admin:guests.csv.more': '... y {{count}} más',
    'admin:guests.csv.uploadComplete': 'Subida completada.',
    'admin:guests.csv.successCreated': 'Creado correctamente: {{count}}',
    'admin:guests.csv.skippedDuplicates': 'Omitidos (duplicados/vacíos): {{count}}',
    'admin:guests.csv.errors': 'Errores: {{count}}',
    'admin:guests.csv.firstError': 'Primer error: {{error}}',
    'admin:guests.csv.uploadingError': 'Error al subir el CSV: {{error}}',
    'admin:guests.error.title': 'Error al cargar los invitados',
    'admin:guests.error.failed': 'No se pudieron cargar los invitados: {{error}}',
    'admin:guests.retry': 'Reintentar',

    // Admin Gifts Section
    'admin:gifts.title': 'Lista de regalos',
    'admin:gifts.add': 'Añadir',
    'admin:gifts.edit': 'Editar regalo',
    'admin:gifts.save': 'Guardar',
    'admin:gifts.deleteConfirm': '¿Eliminar este regalo?',
    'admin:gifts.noImage': 'Sin imagen',
    'admin:gifts.grandTotal': 'Total general',
    'admin:gifts.grandTotalDescription': 'Las tarjetas disponibles x precio',
    'admin:gifts.table.description': 'Descripción',
    'admin:gifts.table.image': 'Imagen',
    'admin:gifts.table.available': 'Disponibles',
    'admin:gifts.table.price': 'Precio',
    'admin:gifts.table.purchased': 'Comprados',
    'admin:gifts.table.actions': 'Acciones',
    'admin:gifts.field.title': 'Nombre',
    'admin:gifts.field.description': 'Descripción',
    'admin:gifts.field.image': 'Imagen',
    'admin:gifts.field.available': 'Número disponible',
    'admin:gifts.field.price': 'Precio',
    'admin:gifts.field.imageHelp': 'Sube la imagen de la tarjeta de regalo (se guardará en la base de datos)',
    'admin:gifts.priceOption.25': '25 €',
    'admin:gifts.priceOption.50': '50 €',
    'admin:gifts.priceOption.100': '100 €',
    'admin:gifts.priceOption.200': '200 €',
    'admin:gifts.priceOption.500': '500 €',

    // Admin Settings Section
    'admin:settings.title': 'Configuración',
    'admin:settings.featureToggles': 'Activar/desactivar funciones',
    'admin:settings.featureTogglesDescription': 'Controla qué funciones están disponibles para los invitados',
    'admin:settings.enableGuestArea': 'Activar zona de invitados',
    'admin:settings.enableGuestAreaDesc': 'Permitir que los invitados inicien sesión y gestionen los miembros de su grupo',
    'admin:settings.showWeddingEvents': 'Mostrar eventos de la boda',
    'admin:settings.showWeddingEventsDesc': 'Mostrar el calendario de eventos de la boda y permitir a los invitados confirmar su asistencia',
    'admin:settings.menu': 'Menú',
    'admin:settings.menuDesc': 'Mostrar selección de menú y preferencias de los invitados',
    'admin:settings.messages': 'Mensajes',
    'admin:settings.messagesDesc': 'Mostrar mensajes',
    'admin:settings.gifts': 'Regalos',
    'admin:settings.giftsDesc': 'Mostrar lista de regalos',

    // Admin Party Management Section
    'admin:party.title': 'Gestionar grupo: ',
    'admin:party.description': 'Gestionar los miembros del grupo de este invitado',
    'admin:party.backToGuests': 'Volver a invitados',
    'admin:party.unknown': 'Desconocido',
    'admin:party.partyMembers': 'Miembros del grupo',
    'admin:party.addMember': 'Añadir miembro',
    'admin:party.noMembers': 'Todavía no se han añadido miembros al grupo.',
    'admin:party.table.name': 'Nombre',
    'admin:party.table.ageGroup': 'Grupo de edad',
    'admin:party.table.actions': 'Acciones',
    'admin:party.addModalTitle': 'Añadir miembro del grupo',
    'admin:party.add': 'Añadir',
    'admin:party.field.name': 'Nombre',
    'admin:party.field.ageGroup': 'Grupo de edad',
    'admin:party.option.adult': 'Adulto (18+)',
    'admin:party.option.child': 'Niño (menor de 18)',
    'admin:party.editModalTitle': 'Editar miembro del grupo',
    'admin:party.save': 'Guardar',
    'admin:party.confirmRemove': '¿Eliminar a este miembro del grupo?',
    'admin:party.error.title': 'Error al cargar el grupo',
    'admin:party.error.failed': 'No se pudieron cargar los miembros del grupo: {{error}}',
    'admin:party.error.loadFailed': 'No se pudieron cargar los miembros del grupo',
    'admin:party.error.addFailed': 'No se pudo añadir el miembro del grupo',
    'admin:party.error.removeFailed': 'No se pudo eliminar el miembro del grupo',
    'admin:party.error.updateFailed': 'No se pudo actualizar el miembro del grupo',
    'admin:party.error.loadingError': 'Error al cargar los miembros del grupo: {{error}}',
    'admin:party.retry': 'Reintentar',

    // Admin Events Section
    'admin:events.title': 'Programa de eventos',
    'admin:events.addEvent': 'Añadir evento',
    'admin:events.noImage': 'Sin imagen',
    'admin:events.confirmDelete': '¿Eliminar este evento?',
    'admin:events.errorDeleting': 'Error al eliminar el evento',
    'admin:events.modal.addTitle': 'Añadir evento',
    'admin:events.modal.editTitle': 'Editar evento',
    'admin:events.add': 'Añadir',
    'admin:events.save': 'Guardar',
    'admin:events.table.name': 'Nombre',
    'admin:events.table.date': 'Fecha',
    'admin:events.table.startTime': 'Hora de inicio',
    'admin:events.table.endTime': 'Hora de fin',
    'admin:events.table.title': 'Título',
    'admin:events.table.image': 'Imagen',
    'admin:events.table.actions': 'Acciones',
    'admin:events.field.name': 'Nombre',
    'admin:events.field.nameHelp': 'p. ej., Ceremonia de la boda',
    'admin:events.field.date': 'Fecha',
    'admin:events.field.dateHelp': 'Fecha del evento (formato España)',
    'admin:events.field.startTime': 'Hora de inicio',
    'admin:events.field.startTimeHelp': 'Hora de inicio (formato 24 h)',
    'admin:events.field.endDate': 'Fecha de fin',
    'admin:events.field.endDateHelp': 'Fecha de fin (opcional, para eventos que duren varios días)',
    'admin:events.field.endTime': 'Hora de fin',
    'admin:events.field.endTimeHelp': 'Hora de fin (formato 24 h, puede ser el día siguiente si se indica fecha de fin)',
    'admin:events.field.location': 'Ubicación',
    'admin:events.field.locationHelp': 'Usa la herramienta de mapa para seleccionar la ubicación exacta',
    'admin:events.field.title': 'Título',
    'admin:events.field.titleHelp': 'p. ej., Restaurante Oyana Beach',
    'admin:events.field.description': 'Descripción',
    'admin:events.field.descriptionHelp': 'Descripción del evento o detalles adicionales',
    'admin:events.field.image': 'Imagen',
    'admin:events.field.imageHelp': 'Sube la imagen del evento (se guardará en la base de datos)',
    'admin:events.error.create': 'No se pudo crear el evento',
    'admin:events.error.update': 'No se pudo actualizar el evento',

    // Admin Sub-events Section
    'admin:subEvents.manageTitle': 'Gestionar subeventos: {{eventName}}',
    'admin:subEvents.close': 'Cerrar',
    'admin:subEvents.addSubEvent': 'Añadir subevento',
    'admin:subEvents.noSubEvents': 'Aún no hay subeventos',
    'admin:subEvents.deleteConfirm': '¿Eliminar este subevento?',
    'admin:subEvents.addTitle': 'Añadir subevento',
    'admin:subEvents.editTitle': 'Editar subevento',
    'admin:subEvents.add': 'Añadir',
    'admin:subEvents.save': 'Guardar',
    'admin:subEvents.field.name': 'Nombre',
    'admin:subEvents.field.nameHelp': 'p. ej., Cóctel de bienvenida',
    'admin:subEvents.field.date': 'Fecha',
    'admin:subEvents.field.startTime': 'Hora de inicio',
    'admin:subEvents.field.endTime': 'Hora de fin',
    'admin:subEvents.field.description': 'Descripción',
    'admin:subEvents.field.descriptionHelp': 'p. ej., Disfruta de cócteles y aperitivos junto a la fuente mientras conoces a otros asistentes',
    'admin:subEvents.field.icon': 'Icono',
    'admin:subEvents.option.ceremony': 'Ceremonia',
    'admin:subEvents.option.cocktails': 'Cócteles',
    'admin:subEvents.option.reception': 'Recepción',
    'admin:subEvents.option.dancing': 'Baile',

    // Admin Menu Management Section
    'admin:menu.title': 'Gestión del menú',
    'admin:menu.courseType.starter': 'Entrantes',
    'admin:menu.courseType.main': 'Platos principales',
    'admin:menu.courseType.dessert': 'Postres',
    'admin:menu.courseType.drinks': 'Bebidas',
    'admin:menu.noOptionsDefined': 'No hay opciones definidas',
    'admin:menu.emptyCourse': 'Aún no se han definido {{courseType}}.',
    'admin:menu.errorLoading': 'Error al cargar el menú',
    'admin:menu.failedToLoad': 'No se pudo cargar el menú: {{error}}',
    'admin:menu.retry': 'Reintentar',
    'admin:menu.confirmDelete': '¿Eliminar esta parte del menú? Esto eliminará todas sus opciones.',
    'admin:menu.confirmDeleteOption': '¿Eliminar esta opción de menú?',
    'admin:menu.errorDeleting': 'Error al eliminar la parte del menú',
    'admin:menu.errorDeletingOption': 'Error al eliminar la opción de menú',
    'admin:menu.editCourse': 'Editar plato',
    'admin:menu.addCourse': 'Añadir plato',
    'admin:menu.save': 'Guardar',
    'admin:menu.add': 'Añadir',
    'admin:menu.field.courseType': 'Tipo de plato',
    'admin:menu.field.courseLabel': 'Etiqueta del plato',
    'admin:menu.field.selectionRequired': 'Selección obligatoria',
 
    
    'admin:menu.option.starter': 'Entrante',
    'admin:menu.option.main': 'Plato principal',
    'admin:menu.option.dessert': 'Postre',
    'admin:menu.option.drinks': 'Bebidas',
    'admin:menu.option.yes': 'Sí: los invitados deben elegir una opción',
    'admin:menu.option.no': 'No: se ofrecerán todas las opciones',
    'admin:menu.field.courseLabelHelp': 'p. ej., "Aperitivos", "Plato principal", "Postres"',

    'admin:menu.field.helpSelectionRequired': 'Si está activado, los invitados deben seleccionar una opción. Si está desactivado, se ofrecerán todas las opciones.',
    'admin:menu.editCourseOption': 'Editar opción de menú',
    'admin:menu.addCourseOption': 'Añadir opción de menú',
    'admin:menu.field.option': 'Opción',
    'admin:menu.field.optionHelp': 'p. ej., Crema de champiñones',
    'admin:menu.field.optionDescription': 'Descripción de la opción',
    'admin:menu.field.optionDescriptionHelp': 'p. ej., Una delicada mezcla de crema, champiñones y ajo',
    'admin:menu.field.option': 'Opción',
    'admin:menu.field.optionDescription': 'Descripción de la opción',
    'admin:menu.field.image': 'Imagen',
    'admin:menu.field.imageHelp': 'Sube la imagen de la opción de menú (se guardará en la base de datos)',
    'admin:menu.field.isVegetarian': 'Vegetariano',
    'admin:menu.field.containsAllergens': 'Contiene alérgenos',
    'admin:menu.field.containsLactose': 'Contiene lactosa',
    'admin:menu.field.isSpicy': 'Picante',
    'admin:menu.field.containsNuts': 'Contiene frutos secos',
    'admin:menu.field.helpVegetarian': 'Esta opción es adecuada para vegetarianos',
    'admin:menu.field.helpAllergens': 'Esta opción contiene alérgenos; por favor revisa la lista de ingredientes',
    'admin:menu.field.helpLactose': 'Esta opción contiene lactosa/productos lácteos',
    'admin:menu.field.helpSpicy': 'Esta opción contiene ingredientes picantes',
    'admin:menu.field.helpNuts': 'Esta opción puede contener frutos secos',


    'adminLogin:pageTitle': 'Inicio de sesión de administrador - Boda de Iluminada y George',
    'adminLogin:subHeader': 'Accede al panel de administración',
    'adminLogin:description': 'Introduce tus credenciales para gestionar los detalles de la boda y los RSVPs.',
    'adminLogin:username': 'Usuario',
    'adminLogin:usernamePlaceholder': 'Tu usuario',
    'adminLogin:password': 'Contraseña',
    'adminLogin:passwordPlaceholder': 'Tu contraseña secreta',
    'adminLogin:submit': 'Iniciar sesión',

    'common:advancedFeatures': 'Ejemplos de funciones avanzadas',
    'common:numberFormatting': 'Formato de números',
    'common:price': 'Precio',
    'common:percentage': 'Porcentaje',
    'common:dateFormatting': 'Formato de fechas',
    'common:currentDate': 'Fecha actual',
    'common:currentTime': 'Hora actual',
    'common:currencyFormatting': 'Formato de divisas',
    'common:gift': 'Regalo',
  },
  fr: {
    // Wedding
    'wedding:date': '6 juin 2026 • Marbella, Espagne',
    'rich:wedding.common.footer': '© 2026 Mariage d’Iluminada &amp; George',
    'wedding:title': 'Iluminada & George',
    'wedding:hero.description': 'Iluminada et George se marient sur la plage de Marbella en juin, et nous sommes ravis de partager ce moment avec vous. Attendez-vous à du soleil, à la mer et à beaucoup de rires.',
    'wedding:hero.description2': 'Ce site est votre espace mariage. Connectez-vous avec l’email de votre RSVP pour confirmer votre groupe, choisir votre menu, voir le programme, consulter notre liste de cadeaux et discuter avec les autres invités.',
    'wedding:subtitle': 'Nous nous marions !',
  
    // Common  
    'common:people': 'personnes',
    'common:person': 'personne',
    'common:days': 'Jours',
    'common:enter.name': 'Saisir le nom...',
    'common:error.saving.menu.selection': 'Erreur lors de l’enregistrement de la sélection de menu',
    'common:error.saving.menu.selections': 'Erreur lors de l’enregistrement des sélections de menu',
    'common:error.saving.special.request': 'Erreur lors de l’enregistrement de la demande spéciale',
    'common:error.saving.special.request.details': 'Erreur lors de l’enregistrement des détails de la demande spéciale',
    'common:home': 'Accueil',
    'common:hours': 'Heures',
    'common:minutes': 'Minutes',
    'common:seconds': 'Secondes',
    'rich:common:cancel': 'Annuler',
    'rich:common:confirm': 'Confirmer',
    'rich:common:confirmAction': 'Confirmer l’action',
    'rich:common:new': '<i class="fas fa-plus-circle"></i> Nouveau',
  
    // Common: Menu
    'common:menu.selection.saved': 'Sélection de menu enregistrée avec succès !',
    'common:menu.selections.saved': 'Sélections de menu enregistrées avec succès !',
    'common:menu.saving': 'Enregistrement...',
    'common:menu.special.request.details.saved': 'Détails de la demande spéciale enregistrés avec succès !',
    'common:menu.special.request.saved': 'Demande spéciale enregistrée avec succès !',
      
    // Common: Party  
    'common:party.members': 'membres',
    'common:party.adult': 'Adulte (18+)',
    'common:party.age.category': 'Catégorie d’âge',
    'common:party.child': 'Enfant',
    'common:party.name': 'Nom',
    'common:party.primary.guest': 'Invité principal',
    'common:party.primary': 'Principal',
    'common:party.remove.member': 'Supprimer le membre',
    'common:party.confirm.remove.member': 'Êtes-vous sûr de vouloir retirer {{memberName}} de votre groupe ?',
  
    // Logon Page
    'login:page.title': 'Accès invité - Mariage',
    'login:guest.zone.title': 'Espace invités',
    'login:header': 'Accès invité',
    'login:email.label': 'Email :',
    'login:email.placeholder': 'Entrez votre email',
    'login:submit': 'Continuer',
    'login:enter.email': 'Veuillez entrer votre email.',
    'login:success.redirecting': 'Connexion réussie. Redirection...',
    'login:email.not.found': 'Email introuvable dans la liste des invités',
    'login:server.error': 'Erreur de connexion au serveur',
  
    // Guests Zone
    'guests:title': 'Espace invités - Mariage d’Iluminada & George',
    'guests:welcome.title': 'Espace invités',
    'guests:summary': 'Résumé',
    'guests:party': 'Groupe',
    'guests:rsvp': 'RSVP',
    'guests:menu': 'Menu',
    'guests:gifts': 'Cadeaux',
  
    // Summary Page
    'guests:summaryPageTitle': 'Votre espace invité pour le mariage d’Iluminada & George',
    'rich:guests:summaryPageDescription': `
        <p>
          Bienvenue dans votre espace personnel pour le mariage d’Iluminada &amp; George. 
          Depuis ici, vous pouvez participer aux préparatifs, garder vos informations à jour 
          et nous aider à faire en sorte que la fête soit parfaitement adaptée à vous et à votre groupe.
        </p>
        <p>
          Dans cet espace, vous pouvez mettre à jour les noms de toutes les personnes de votre groupe, nous indiquer d’éventuelles allergies alimentaires 
          ou besoins spécifiques, confirmer qui participera à chacun des événements du mariage, 
          choisir vos plats et boissons préférés pour le banquet, envoyer des messages aux autres invités 
          et, si vous le souhaitez, choisir un cadeau pour nous dans la liste de mariage.  
          Nous sommes tellement heureux de fêter cela avec vous. ❤️
        </p>
      `,
    'guests:summaryYourParty': 'Votre groupe',
    'guests:summaryRSVP': 'Résumé des réponses',
    'guests:summaryMenuSelections': 'Sélections de menu',
  
    'guests:loadingPartyMembers': 'Chargement des membres du groupe...',
    'guests:loadingComments': 'Chargement des commentaires...',
    'guests:partyManagement': 'Gestion du groupe',
    'rich:guests:partyManagementDesc': 'Gérez les membres de votre groupe de mariage et leurs exigences alimentaires.',
    'guests:giftsSelection': 'Sélection de cadeaux',
    'rich:guests:giftsSelectionDesc': 'Choisissez vos cadeaux préférés pour nos célébrations de mariage.',
    'guests:eventsRSVP': 'RSVP',
    'rich:guests:eventsRSVPDesc': 'Les célébrations se dérouleront sur trois jours : vendredi, samedi et dimanche. Elles commencent le vendredi par un dîner de bienvenue. Le samedi est une journée complète d’activités incluant la cérémonie de mariage, le banquet de réception et la soirée dansante. Le dimanche se terminera par un brunch d’au revoir. Veuillez confirmer les événements auxquels vous participerez.',
  
    // Party Page
    'guests:party.page.title': 'Gestion du groupe',
    'guests:party.page.description': 'Gérez les membres de votre groupe de mariage et leurs exigences alimentaires.',
    'guests:partyMembersSaved': 'Membres du groupe enregistrés avec succès !',
    'guests:errorSavingPartyMembers': 'Erreur lors de l’enregistrement des membres du groupe',
    'rich:guests:savePartyMembers': '<i class="fas fa-save"></i> Enregistrer les membres du groupe',
    'rich:guests:partyMembersTitle': '<i class="fas fa-users"></i> Membres du groupe',
    'guests:partyDescription': 'Votre groupe comprend toutes les personnes qui assisteront au mariage avec vous. Vous pouvez ajouter jusqu’à {{maxPartySize}} membres, vous compris.',
    'rich:guests:addPartyMember': '<i class="fas fa-plus-circle"></i> Ajouter un membre',
    'rich:guests:dietaryRequirements': '<i class="fas fa-utensils"></i> Exigences alimentaires',
    'guests:dietaryDescription': 'Veuillez nous indiquer les exigences alimentaires ou allergies de chaque membre du groupe.',
    'guests:dietaryRequirementsSaved': 'Exigences alimentaires enregistrées avec succès !',
    'common:errorSavingDietaryRequirements': 'Erreur lors de l’enregistrement des exigences alimentaires',
    
    // Events Page
    'guests:eventsPageTitle': 'RSVP aux événements du mariage ci-dessous',
    'guests:eventsPageDescription': 'Nous sommes ravis que vous puissiez vous joindre à nous pour le mariage. Voici les détails de tous les événements prévus. Veuillez sélectionner votre nom dans chaque événement, dans la section « Qui participe ? ». Ainsi nous pourrons tout préparer pour que vous passiez un moment formidable.',
  
    'guests:eventsLoading': 'Chargement des événements...',
    'guests:eventsNoEvents': 'Aucun événement disponible',
    'guests:eventsNoEventsDescription': 'Aucun événement n’est encore planifié. Veuillez revenir plus tard.',
    'guests:eventsNoPartyMembers': 'Aucun membre de groupe trouvé.',
    'guests:eventsViewOnMap': 'Voir sur la carte',
    'guests:eventsWhosAttending': 'Qui participe ?',
    'guests:eventsErrorTitle': 'Erreur lors du chargement des événements',
    'guests:eventsErrorMessage': 'Un problème est survenu lors du chargement des événements. Veuillez réessayer.',
    'guests:eventsSchedule': 'Programme',
    'guests:childBadge': 'Enfant',
    'guests:eventsAttendanceSavedSuccess': 'Choix de présence enregistrés avec succès !',
    'guests:eventsAttendanceSavedError': 'Erreur lors de l’enregistrement des choix de présence',
    'guests:eventsSaveAttendanceChoices': 'Enregistrer les choix de présence',
    'guests:logout': 'Déconnexion',
    'guests:event': 'Événement',
  
    // Menu Page
    'guests:menuPageTitle': 'Sélection de menu',
    'guests:menuPageDescription': 'Choisissez vos plats préférés pour le banquet de mariage.',
    'guests:menuSelection': 'Sélection de menu',
    'guests:menuSelectionDesc': 'Votre sélection de menu actuelle pour notre mariage.',
    'guests:menuSelectionDesc2': 'Choisissez vos plats préférés pour notre mariage.',
    'guests:yourSummary': 'Votre résumé',
  
  
    // Comments Page
    'guests:commentsTitle': 'Commentaires',
    'rich:guests:commentsSubtitle': 'Partagez vos pensées avec les autres invités',
    'rich:guests:commentPlaceholder': `
        <textarea
          id="newComment"
          name="comment"
          placeholder="Écrivez votre commentaire..."
          rows="3"
          maxlength="500"
        ></textarea>
       `,
    'guests:postComment': 'Publier',
  
    'guests:welcome': 'Bienvenue',
    
    // Menu Selection Page
    'guests:menuLoading': 'Chargement du menu...',
    'guests:menuErrorTitle': 'Erreur lors du chargement du menu',
    'guests:menuErrorMessage': 'Impossible de charger les données du menu. Veuillez réessayer plus tard.',
    'guests:menuErrorMessage2': 'Un problème est survenu lors du chargement du menu. Veuillez réessayer.',
    'guests:retry': 'Réessayer',
    'guests:courseGroupStarters': 'Entrées',
    'guests:courseGroupMainCourses': 'Plats principaux',
    'guests:courseGroupDesserts': 'Desserts',
    'guests:courseGroupDrinks': 'Boissons',
    'guests:selectionRequired': 'Sélection obligatoire',
    'guests:infoOnly': 'Information uniquement',
    'guests:whosHavingThis': 'Qui prendra ce plat ?',
    'guests:selectedCount': 'sélectionné(s)',
    'guests:dietaryRequirementsTitle': 'Exigences alimentaires & demandes spéciales',
    'guests:dietaryRequirementsDescription': 'Veuillez nous informer des exigences alimentaires ou allergies de chaque invité.',
    'guests:dietaryVegetarian': 'Végétarien',
    'guests:dietaryLactose Intolerant': 'Intolérance au lactose',
    'guests:dietaryGluten Intolerant': 'Intolérance au gluten',
    'guests:dietaryNut Allergy': 'Allergie aux fruits à coque',
    'guests:dietaryOther': 'Autre',
    'guests:additionalDetailsLabel': 'Détails supplémentaires ou demandes spécifiques :',
    'guests:additionalDetailsPlaceholder': 'Veuillez décrire tout besoin alimentaire particulier, allergie ou demande spéciale...',
    'guests:saveMenuSelections': 'Enregistrer les sélections de menu',
    'rich:guests:saveDietaryRequirements': '<i class="fas fa-save"></i> Enregistrer les exigences alimentaires',
    
    // Gifts Page
    'guests:giftsPageTitle': 'Liste de cadeaux',
    'guests:giftsPageDescription': 'Votre présence est notre cadeau. Mais si vous souhaitez contribuer à notre lune de miel, vous pouvez choisir un cadeau amusant dans la liste ci-dessous ; il sera imprimé avec votre message et affiché sur un grand mur lors du banquet de mariage. Le montant que vous choisissez servira à financer notre lune de miel. Merci.',
    'guests:giftsLoading': 'Chargement des cadeaux...',
    'guests:giftsThankYouTitle': 'Merci pour votre générosité !',
    'guests:giftsThankYouMessage': 'Nous sommes très reconnaissants pour vos merveilleux cadeaux',
    'rich:guests:giftsDonatedOn': 'Offert le {{date}}',
    'guests:giftsRegistryTitle': 'Liste de mariage',
    'guests:giftsRegistrySubtitle': 'Choisissez parmi nos cadeaux soigneusement sélectionnés',
    'guests:giftsNoAvailable': 'Aucun cadeau disponible',
    'guests:giftsNoAvailableDescription': 'Veuillez revenir plus tard pour consulter notre liste de cadeaux.',
    'guests:giftsAvailable': 'disponible(s)',
    'guests:giftsSoldOut': 'Épuisé',
    'guests:giftsBuyGift': 'Acheter le cadeau',
    'guests:giftsPaymentSuccess': 'Merci pour votre cadeau ! Votre paiement a été effectué avec succès.',
    'guests:giftsPaymentCancelled': 'Le paiement a été annulé.',
    'guests:giftsErrorLoading': 'Erreur lors du chargement des cadeaux',
    'guests:giftsErrorLoadingDescription': 'Un problème est survenu lors du chargement des cadeaux. Veuillez réessayer.',
    'guests:giftsRetry': 'Réessayer',
    'guests:giftsPurchaseTitle': 'Acheter un cadeau',
    'guests:giftsPurchaseAbout': 'Vous êtes sur le point d’acheter :',
    'guests:giftsPurchaseMessageLabel': 'Ajouter un message personnel (optionnel) :',
    'guests:giftsPurchaseMessagePlaceholder': 'Laissez un joli message pour les mariés...',
    'guests:giftsPurchaseCancel': 'Annuler',
    'guests:giftsPurchaseProceed': 'Procéder au paiement',
    'guests:giftsPurchaseProcessing': 'Traitement en cours...',
    'guests:giftsPaymentError': 'Erreur lors du traitement du paiement',
    'guests:giftsPaymentServiceError': 'Erreur de connexion au service de paiement',
  
  
    // Admin
    'admin:pageTitle': 'Panneau d’administration - Mariage d’Iluminada & George',
    'admin:title': 'Panneau d’administration',
    'admin:logout': 'Se déconnecter',
    'admin:welcomeTitle': 'Bienvenue, administrateur',
    'admin:welcomeDesc': 'Gérez toutes les informations du mariage d’Iluminada et George',
    'admin:tab.guests': 'Invités',
    'admin:tab.gifts': 'Liste de cadeaux',
    'admin:tab.messages': 'Messages',
    'admin:tab.events': 'Programme des événements',
    'admin:tab.menus': 'Gestion du menu',
    'admin:tab.settings': 'Paramètres',
    'admin:loading': 'Chargement...',
    'admin:uploadingGuests': 'Téléchargement des invités...',
    'admin:loadingPartyMembers': 'Chargement des membres du groupe...',
    'admin:loadingGiftList': 'Chargement de la liste de cadeaux...',
    'admin:loadingMessages': 'Chargement des messages...',
    'admin:loadingEventSchedule': 'Chargement du programme des événements...',
    'admin:loadingCourses': 'Chargement des plats...',
    'admin:loadingSettings': 'Chargement des paramètres...',
    'admin:footer': 'Panneau d’administration',
  
    // Admin Messages Section
    'admin:messages.title': 'Nettoyage des messages',
    'admin:messages.subtitle': 'Supprimez tout message d’invité inapproprié ou offensant',
    'admin:messages.noMessages': 'Aucun message pour l’instant. Les invités apparaîtront ici lorsqu’ils publieront des commentaires.',
    'admin:messages.loading': 'Chargement des messages...',
    'admin:messages.errorTitle': 'Erreur lors du chargement des messages',
    'admin:messages.errorMessage': 'Échec du chargement des messages : {{error}}',
    'admin:messages.retry': 'Réessayer',
    'admin:messages.delete': 'Supprimer',
  
    // Admin Guests Section
    'admin:guests.errorLoading': 'Échec du chargement des invités',
    'admin:guests.adult': 'Adulte',
    'admin:guests.child': 'Enfant',
    'admin:guests.totalGuests': 'Nombre total d’invités',
    'admin:guests.acrossParties': 'Répartis sur {{count}} {{partyWord}}',
    'admin:guests.addGuest': 'Ajouter un invité',
    'admin:guests.bulkUploadCsv': 'Import CSV en masse',
    'admin:guests.table.email': 'Email',
    'admin:guests.table.partySize': 'Taille du groupe',
    'admin:guests.table.actions': 'Actions',
    'admin:guests.confirmDelete': 'Supprimer cet invité et tout son groupe ?',
    'admin:guests.editTitle': 'Modifier l’invité',
    'admin:guests.addTitle': 'Ajouter un invité',
    'admin:guests.save': 'Enregistrer',
    'admin:guests.add': 'Ajouter',
    'admin:guests.field.name': 'Nom',
    'admin:guests.field.email': 'Email',
    'admin:guests.field.ageCategory': 'Catégorie d’âge',
    'admin:guests.option.adult': 'Adulte (18+)',
    'admin:guests.option.child': 'Enfant (moins de 18 ans)',
    'admin:guests.csv.noValidGuests': 'Aucun invité valide trouvé dans le fichier CSV',
    'admin:guests.csv.uploadCount': 'Importer {{count}} invités ?',
    'admin:guests.csv.preview': 'Aperçu :',
    'admin:guests.csv.more': '... et {{count}} de plus',
    'admin:guests.csv.uploadComplete': 'Import terminé !',
    'admin:guests.csv.successCreated': 'Créés avec succès : {{count}}',
    'admin:guests.csv.skippedDuplicates': 'Ignorés (doublons/vides) : {{count}}',
    'admin:guests.csv.errors': 'Erreurs : {{count}}',
    'admin:guests.csv.firstError': 'Première erreur : {{error}}',
    'admin:guests.csv.uploadingError': 'Erreur lors de l’import du CSV : {{error}}',
    'admin:guests.error.title': 'Erreur lors du chargement des invités',
    'admin:guests.error.failed': 'Échec du chargement des invités : {{error}}',
    'admin:guests.retry': 'Réessayer',
  
    // Admin Gifts Section
    'admin:gifts.title': 'Liste de cadeaux',
    'admin:gifts.add': 'Ajouter',
    'admin:gifts.edit': 'Modifier le cadeau',
    'admin:gifts.save': 'Enregistrer',
    'admin:gifts.deleteConfirm': 'Supprimer ce cadeau ?',
    'admin:gifts.noImage': 'Aucune image',
    'admin:gifts.grandTotal': 'Total général',
    'admin:gifts.grandTotalDescription': 'Cartes disponibles x prix',
    'admin:gifts.table.description': 'Description',
    'admin:gifts.table.image': 'Image',
    'admin:gifts.table.available': 'Disponibles',
    'admin:gifts.table.price': 'Prix',
    'admin:gifts.table.purchased': 'Achetées',
    'admin:gifts.table.actions': 'Actions',
    'admin:gifts.field.title': 'Nom',
    'admin:gifts.field.description': 'Description',
    'admin:gifts.field.image': 'Image',
    'admin:gifts.field.available': 'Nombre disponible',
    'admin:gifts.field.price': 'Prix',
    'admin:gifts.field.imageHelp': 'Téléchargez l’image de la carte cadeau (elle sera stockée dans la base de données)',
    'admin:gifts.priceOption.25': '25 €',
    'admin:gifts.priceOption.50': '50 €',
    'admin:gifts.priceOption.100': '100 €',
    'admin:gifts.priceOption.200': '200 €',
    'admin:gifts.priceOption.500': '500 €',
  
    // Admin Settings Section
    'admin:settings.title': 'Paramètres',
    'admin:settings.featureToggles': 'Fonctionnalités',
    'admin:settings.featureTogglesDescription': 'Contrôlez les fonctionnalités disponibles pour les invités',
    'admin:settings.enableGuestArea': 'Activer l’espace invités',
    'admin:settings.enableGuestAreaDesc': 'Permettre aux invités de se connecter et de gérer les membres de leur groupe',
    'admin:settings.showWeddingEvents': 'Afficher les événements de mariage',
    'admin:settings.showWeddingEventsDesc': 'Afficher le calendrier des événements du mariage et permettre aux invités de confirmer leur présence',
    'admin:settings.menu': 'Menu',
    'admin:settings.menuDesc': 'Afficher la sélection de menu et les préférences des invités',
    'admin:settings.messages': 'Messages',
    'admin:settings.messagesDesc': 'Afficher les messages',
    'admin:settings.gifts': 'Cadeaux',
    'admin:settings.giftsDesc': 'Afficher la liste de cadeaux',
  
    // Admin Party Management Section
    'admin:party.title': 'Gérer le groupe : ',
    'admin:party.description': 'Gérer les membres du groupe pour cet invité',
    'admin:party.backToGuests': 'Retour aux invités',
    'admin:party.unknown': 'Inconnu',
    'admin:party.partyMembers': 'Membres du groupe',
    'admin:party.addMember': 'Ajouter un membre',
    'admin:party.noMembers': 'Aucun membre de groupe ajouté pour le moment.',
    'admin:party.table.name': 'Nom',
    'admin:party.table.ageGroup': 'Groupe d’âge',
    'admin:party.table.actions': 'Actions',
    'admin:party.addModalTitle': 'Ajouter un membre du groupe',
    'admin:party.add': 'Ajouter',
    'admin:party.field.name': 'Nom',
    'admin:party.field.ageGroup': 'Groupe d’âge',
    'admin:party.option.adult': 'Adulte (18+)',
    'admin:party.option.child': 'Enfant (moins de 18 ans)',
    'admin:party.editModalTitle': 'Modifier le membre du groupe',
    'admin:party.save': 'Enregistrer',
    'admin:party.confirmRemove': 'Supprimer ce membre du groupe ?',
    'admin:party.error.title': 'Erreur lors du chargement du groupe',
    'admin:party.error.failed': 'Échec du chargement des membres du groupe : {{error}}',
    'admin:party.error.loadFailed': 'Échec du chargement des membres du groupe',
    'admin:party.error.addFailed': 'Échec de l’ajout du membre du groupe',
    'admin:party.error.removeFailed': 'Échec de la suppression du membre du groupe',
    'admin:party.error.updateFailed': 'Échec de la mise à jour du membre du groupe',
    'admin:party.error.loadingError': 'Erreur lors du chargement des membres du groupe : {{error}}',
    'admin:party.retry': 'Réessayer',
  
    // Admin Events Section
    'admin:events.title': 'Programme des événements',
    'admin:events.addEvent': 'Ajouter un événement',
    'admin:events.noImage': 'Aucune image',
    'admin:events.confirmDelete': 'Supprimer cet événement ?',
    'admin:events.errorDeleting': 'Erreur lors de la suppression de l’événement',
    'admin:events.modal.addTitle': 'Ajouter un événement',
    'admin:events.modal.editTitle': 'Modifier l’événement',
    'admin:events.add': 'Ajouter',
    'admin:events.save': 'Enregistrer',
    'admin:events.table.name': 'Nom',
    'admin:events.table.date': 'Date',
    'admin:events.table.startTime': 'Heure de début',
    'admin:events.table.endTime': 'Heure de fin',
    'admin:events.table.title': 'Titre',
    'admin:events.table.image': 'Image',
    'admin:events.table.actions': 'Actions',
    'admin:events.field.name': 'Nom',
    'admin:events.field.nameHelp': 'ex. Cérémonie de mariage',
    'admin:events.field.date': 'Date',
    'admin:events.field.dateHelp': 'Date de l’événement (format Espagne)',
    'admin:events.field.startTime': 'Heure de début',
    'admin:events.field.startTimeHelp': 'Heure de début (format 24 h)',
    'admin:events.field.endDate': 'Date de fin',
    'admin:events.field.endDateHelp': 'Date de fin (optionnelle, pour les événements sur plusieurs jours)',
    'admin:events.field.endTime': 'Heure de fin',
    'admin:events.field.endTimeHelp': 'Heure de fin (format 24 h, peut être le lendemain si une date de fin est indiquée)',
    'admin:events.field.location': 'Lieu',
    'admin:events.field.locationHelp': 'Utilisez l’outil de carte pour sélectionner l’emplacement précis',
    'admin:events.field.title': 'Titre',
    'admin:events.field.titleHelp': 'ex. Restaurant Oyana Beach',
    'admin:events.field.description': 'Description',
    'admin:events.field.descriptionHelp': 'Description de l’événement ou détails supplémentaires',
    'admin:events.field.image': 'Image',
    'admin:events.field.imageHelp': 'Téléchargez l’image de l’événement (elle sera stockée dans la base de données)',
    'admin:events.error.create': 'Échec de la création de l’événement',
    'admin:events.error.update': 'Échec de la mise à jour de l’événement',
  
    // Admin Sub-events Section
    'admin:subEvents.manageTitle': 'Gérer les sous-événements : {{eventName}}',
    'admin:subEvents.close': 'Fermer',
    'admin:subEvents.addSubEvent': 'Ajouter un sous-événement',
    'admin:subEvents.noSubEvents': 'Aucun sous-événement pour le moment',
    'admin:subEvents.deleteConfirm': 'Supprimer ce sous-événement ?',
    'admin:subEvents.addTitle': 'Ajouter un sous-événement',
    'admin:subEvents.editTitle': 'Modifier le sous-événement',
    'admin:subEvents.add': 'Ajouter',
    'admin:subEvents.save': 'Enregistrer',
    'admin:subEvents.field.name': 'Nom',
    'admin:subEvents.field.nameHelp': 'ex. Cocktails de bienvenue',
    'admin:subEvents.field.date': 'Date',
    'admin:subEvents.field.startTime': 'Heure de début',
    'admin:subEvents.field.endTime': 'Heure de fin',
    'admin:subEvents.field.description': 'Description',
    'admin:subEvents.field.descriptionHelp': 'ex. Profitez de cocktails et d’amuse-bouches près de la fontaine tout en rencontrant les autres invités',
    'admin:subEvents.field.icon': 'Icône',
    'admin:subEvents.option.ceremony': 'Cérémonie',
    'admin:subEvents.option.cocktails': 'Cocktails',
    'admin:subEvents.option.reception': 'Réception',
    'admin:subEvents.option.dancing': 'Soirée dansante',
  
    // Admin Menu Management Section
    'admin:menu.title': 'Gestion du menu',
    'admin:menu.courseType.starter': 'Entrées',
    'admin:menu.courseType.main': 'Plats principaux',
    'admin:menu.courseType.dessert': 'Desserts',
    'admin:menu.courseType.drinks': 'Boissons',
    'admin:menu.noOptionsDefined': 'Aucune option définie',
    'admin:menu.emptyCourse': 'Aucun {{courseType}} défini pour le moment.',
    'admin:menu.errorLoading': 'Erreur lors du chargement du menu',
    'admin:menu.failedToLoad': 'Échec du chargement du menu : {{error}}',
    'admin:menu.retry': 'Réessayer',
    'admin:menu.confirmDelete': 'Supprimer cette partie du menu ? Cela supprimera toutes ses options.',
    'admin:menu.confirmDeleteOption': 'Supprimer cette option de menu ?',
    'admin:menu.errorDeleting': 'Erreur lors de la suppression de la partie du menu',
    'admin:menu.errorDeletingOption': 'Erreur lors de la suppression de l’option de menu',
    'admin:menu.editCourse': 'Modifier le plat',
    'admin:menu.addCourse': 'Ajouter un plat',
    'admin:menu.save': 'Enregistrer',
    'admin:menu.add': 'Ajouter',
    'admin:menu.field.courseType': 'Type de plat',
    'admin:menu.field.courseLabel': 'Libellé du plat',
    'admin:menu.field.selectionRequired': 'Sélection obligatoire',
    
    'admin:menu.option.starter': 'Entrée',
    'admin:menu.option.main': 'Plat principal',
    'admin:menu.option.dessert': 'Dessert',
    'admin:menu.option.drinks': 'Boissons',
    'admin:menu.option.yes': 'Oui - Les invités doivent choisir une option',
    'admin:menu.option.no': 'Non - Toutes les options seront proposées',
    'admin:menu.field.courseLabelHelp': 'ex. « Apéritifs », « Plat principal », « Desserts »',
  
    'admin:menu.field.helpSelectionRequired': 'Si activé, les invités doivent sélectionner une option. Si désactivé, toutes les options seront proposées.',
    'admin:menu.editCourseOption': 'Modifier l’option de menu',
    'admin:menu.addCourseOption': 'Ajouter une option de menu',
    'admin:menu.field.option': 'Option',
    'admin:menu.field.optionHelp': 'ex. Crème de champignons',
    'admin:menu.field.optionDescription': 'Description de l’option',
    'admin:menu.field.optionDescriptionHelp': 'ex. Un délicat mélange de crème, de champignons et d’ail',
    'admin:menu.field.image': 'Image',
    'admin:menu.field.imageHelp': 'Téléchargez l’image de l’option de menu (elle sera stockée dans la base de données)',
    'admin:menu.field.isVegetarian': 'Végétarien',
    'admin:menu.field.containsAllergens': 'Contient des allergènes',
    'admin:menu.field.containsLactose': 'Contient du lactose',
    'admin:menu.field.isSpicy': 'Épicé',
    'admin:menu.field.containsNuts': 'Contient des fruits à coque',
    'admin:menu.field.helpVegetarian': 'Cette option convient aux végétariens',
    'admin:menu.field.helpAllergens': 'Cette option contient des allergènes - veuillez consulter la liste des ingrédients',
    'admin:menu.field.helpLactose': 'Cette option contient du lactose / des produits laitiers',
    'admin:menu.field.helpSpicy': 'Cette option contient des ingrédients épicés',
    'admin:menu.field.helpNuts': 'Cette option peut contenir des fruits à coque',
  
    'adminLogin:pageTitle': 'Connexion administrateur - Mariage d’Iluminada & George',
    'adminLogin:subHeader': 'Accéder au panneau d’administration',
    'adminLogin:description': 'Saisissez vos identifiants pour gérer les détails du mariage et les RSVP.',
    'adminLogin:username': 'Nom d’utilisateur',
    'adminLogin:usernamePlaceholder': 'Votre nom d’utilisateur',
    'adminLogin:password': 'Mot de passe',
    'adminLogin:passwordPlaceholder': 'Votre mot de passe secret',
    'adminLogin:submit': 'Se connecter',
  
    'common:advancedFeatures': 'Exemples de fonctionnalités avancées',
    'common:numberFormatting': 'Formatage des nombres',
    'common:price': 'Prix',
    'common:percentage': 'Pourcentage',
    'common:dateFormatting': 'Formatage des dates',
    'common:currentDate': 'Date actuelle',
    'common:currentTime': 'Heure actuelle',
    'common:currencyFormatting': 'Formatage des devises',
    'common:gift': 'Cadeau',
  },
  de: {
    // Wedding
    'wedding:date': '6. Juni 2026 • Marbella, Spanien',
    'rich:wedding.common.footer': '© 2026 Hochzeit von Iluminada &amp; George',
    'wedding:title': 'Iluminada & George',
    'wedding:hero.description': 'Iluminada und George heiraten diesen Juni am Strand von Marbella, und wir freuen uns sehr, das mit dir zu teilen. Dich erwarten Sonne, Meer und jede Menge Lachen.',
    'wedding:hero.description2': 'Diese Seite ist dein Hochzeitsportal. Melde dich mit der E-Mail aus deinem RSVP an, um deine Gruppe zu bestätigen, dein Menü zu wählen, den Ablauf zu sehen, unsere Geschenkliste anzuschauen und mit anderen Gästen zu chatten.',
    'wedding:subtitle': 'Wir heiraten!',
  
    // Common  
    'common:people': 'Personen',
    'common:person': 'Person',
    'common:days': 'Tage',
    'common:enter.name': 'Namen eingeben...',
    'common:error.saving.menu.selection': 'Fehler beim Speichern der Menüauswahl',
    'common:error.saving.menu.selections': 'Fehler beim Speichern der Menüauswahlen',
    'common:error.saving.special.request': 'Fehler beim Speichern des Sonderwunsches',
    'common:error.saving.special.request.details': 'Fehler beim Speichern der Details des Sonderwunsches',
    'common:home': 'Startseite',
    'common:hours': 'Stunden',
    'common:minutes': 'Minuten',
    'common:seconds': 'Sekunden',
    'rich:common:cancel': 'Abbrechen',
    'rich:common:confirm': 'Bestätigen',
    'rich:common:confirmAction': 'Aktion bestätigen',
    'rich:common:new': '<i class="fas fa-plus-circle"></i> Neu',
  
    // Common: Menu
    'common:menu.selection.saved': 'Menüauswahl erfolgreich gespeichert!',
    'common:menu.selections.saved': 'Menüauswahlen erfolgreich gespeichert!',
    'common:menu.saving': 'Speichere...',
    'common:menu.special.request.details.saved': 'Details des Sonderwunsches erfolgreich gespeichert!',
    'common:menu.special.request.saved': 'Sonderwunsch erfolgreich gespeichert!',
      
    // Common: Party  
    'common:party.members': 'Mitglieder',
    'common:party.adult': 'Erwachsener (18+)',
    'common:party.age.category': 'Alterskategorie',
    'common:party.child': 'Kind',
    'common:party.name': 'Name',
    'common:party.primary.guest': 'Hauptgast',
    'common:party.primary': 'Hauptgast',
    'common:party.remove.member': 'Mitglied entfernen',
    'common:party.confirm.remove.member': 'Möchtest du {{memberName}} wirklich aus deiner Gruppe entfernen?',
  
    // Logon Page
    'login:page.title': 'Gästezugang - Hochzeit',
    'login:guest.zone.title': 'Gästebereich',
    'login:header': 'Gästezugang',
    'login:email.label': 'E-Mail:',
    'login:email.placeholder': 'Gib deine E-Mail-Adresse ein',
    'login:submit': 'Weiter',
    'login:enter.email': 'Bitte gib deine E-Mail-Adresse ein.',
    'login:success.redirecting': 'Anmeldung erfolgreich. Weiterleitung...',
    'login:email.not.found': 'E-Mail nicht in der Gästeliste gefunden',
    'login:server.error': 'Serververbindungsfehler',
  
    // Guests Zone
    'guests:title': 'Gästebereich - Hochzeit von Iluminada & George',
    'guests:welcome.title': 'Gästebereich',
    'guests:summary': 'Übersicht',
    'guests:party': 'Gruppe',
    'guests:rsvp': 'RSVP',
    'guests:menu': 'Menü',
    'guests:gifts': 'Geschenke',
  
    // Summary Page
    'guests:summaryPageTitle': 'Dein Gästebereich für die Hochzeit von Iluminada & George',
    'rich:guests:summaryPageDescription': `
        <p>
          Willkommen in deinem persönlichen Bereich für die Hochzeit von Iluminada &amp; George. 
          Von hier aus kannst du an der Planung teilhaben, deine Daten aktuell halten 
          und uns helfen, die Feier genau richtig für dich und deine Gruppe zu gestalten.
        </p>
        <p>
          In diesem Bereich kannst du die Namen aller Personen in deiner Gruppe aktualisieren, uns über Lebensmittelallergien 
          oder besondere Ernährungsbedürfnisse informieren, bestätigen, wer an welchen Hochzeitsveranstaltungen teilnimmt, 
          deine bevorzugten Gänge und Getränke für das Bankett auswählen, Nachrichten an andere Gäste senden 
          und, wenn du möchtest, ein Geschenk für uns aus der Geschenkliste auswählen.  
          Wir freuen uns so sehr, dies mit dir zu feiern. ❤️
        </p>
      `,
    'guests:summaryYourParty': 'Deine Gruppe',
    'guests:summaryRSVP': 'RSVP-Übersicht',
    'guests:summaryMenuSelections': 'Menüauswahlen',
  
    'guests:loadingPartyMembers': 'Lade Gruppenmitglieder...',
    'guests:loadingComments': 'Lade Kommentare...',
    'guests:partyManagement': 'Gruppenverwaltung',
    'rich:guests:partyManagementDesc': 'Verwalte die Mitglieder deiner Hochzeitsgruppe und ihre Ernährungsbedürfnisse.',
    'guests:giftsSelection': 'Geschenkauswahl',
    'rich:guests:giftsSelectionDesc': 'Wähle deine Lieblingsgeschenke für unsere Hochzeitsfeiern.',
    'guests:eventsRSVP': 'RSVP',
    'rich:guests:eventsRSVPDesc': 'Die Feierlichkeiten finden an drei Tagen statt: Freitag, Samstag und Sonntag. Am Freitag beginnen wir mit einem Willkommensdinner. Der Samstag ist ein voller Tag mit Aktivitäten, einschließlich der Trauung, dem Empfangsbankett und Tanz. Am Sonntag gibt es einen Abschiedsbrunch. Bitte bestätige deine Teilnahme für die Veranstaltungen, an denen du dabei sein wirst.',
  
    // Party Page
    'guests:party.page.title': 'Gruppenverwaltung',
    'guests:party.page.description': 'Verwalte die Mitglieder deiner Hochzeitsgruppe und ihre Ernährungsbedürfnisse.',
    'guests:partyMembersSaved': 'Gruppenmitglieder erfolgreich gespeichert!',
    'guests:errorSavingPartyMembers': 'Fehler beim Speichern der Gruppenmitglieder',
    'rich:guests:savePartyMembers': '<i class="fas fa-save"></i> Gruppenmitglieder speichern',
    'rich:guests:partyMembersTitle': '<i class="fas fa-users"></i> Gruppenmitglieder',
    'guests:partyDescription': 'Zu deiner Gruppe gehören alle Personen, die mit dir zur Hochzeit kommen. Du kannst bis zu {{maxPartySize}} Gruppenmitglieder inklusive dir selbst hinzufügen.',
    'rich:guests:addPartyMember': '<i class="fas fa-plus-circle"></i> Gruppenmitglied hinzufügen',
    'rich:guests:dietaryRequirements': '<i class="fas fa-utensils"></i> Ernährungsbedürfnisse',
    'guests:dietaryDescription': 'Bitte teile uns die Ernährungsbedürfnisse oder Allergien jedes Gruppenmitglieds mit.',
    'guests:dietaryRequirementsSaved': 'Ernährungsbedürfnisse erfolgreich gespeichert!',
    'common:errorSavingDietaryRequirements': 'Fehler beim Speichern der Ernährungsbedürfnisse',
    
    // Events Page
    'guests:eventsPageTitle': 'RSVP zu den folgenden Hochzeitsveranstaltungen',
    'guests:eventsPageDescription': 'Wir freuen uns sehr, dass du bei unserer Hochzeit dabei bist. Hier findest du die Details zu allen Veranstaltungen. Bitte wähle bei jeder Veranstaltung deinen Namen im Bereich „Wer nimmt teil?“, damit wir alles für dich vorbereiten können.',
  
    'guests:eventsLoading': 'Lade Veranstaltungen...',
    'guests:eventsNoEvents': 'Keine Veranstaltungen verfügbar',
    'guests:eventsNoEventsDescription': 'Es sind noch keine Veranstaltungen geplant. Bitte schaue später noch einmal vorbei.',
    'guests:eventsNoPartyMembers': 'Keine Gruppenmitglieder gefunden.',
    'guests:eventsViewOnMap': 'Auf Karte anzeigen',
    'guests:eventsWhosAttending': 'Wer nimmt teil?',
    'guests:eventsErrorTitle': 'Fehler beim Laden der Veranstaltungen',
    'guests:eventsErrorMessage': 'Beim Laden der Veranstaltungen ist ein Problem aufgetreten. Bitte versuche es erneut.',
    'guests:eventsSchedule': 'Ablauf',
    'guests:childBadge': 'Kind',
    'guests:eventsAttendanceSavedSuccess': 'Teilnahmeauswahl erfolgreich gespeichert!',
    'guests:eventsAttendanceSavedError': 'Fehler beim Speichern der Teilnahmeauswahl',
    'guests:eventsSaveAttendanceChoices': 'Teilnahmeauswahl speichern',
    'guests:logout': 'Abmelden',
    'guests:event': 'Veranstaltung',
  
    // Menu Page
    'guests:menuPageTitle': 'Menüauswahl',
    'guests:menuPageDescription': 'Wähle deine bevorzugten Gerichte für das Hochzeitsbankett.',
    'guests:menuSelection': 'Menüauswahl',
    'guests:menuSelectionDesc': 'Deine aktuelle Menüauswahl für unsere Hochzeit.',
    'guests:menuSelectionDesc2': 'Wähle deine bevorzugten Gerichte für unsere Hochzeit.',
    'guests:yourSummary': 'Deine Übersicht',
  
  
    // Comments Page
    'guests:commentsTitle': 'Kommentare',
    'rich:guests:commentsSubtitle': 'Teile deine Gedanken mit den anderen Gästen',
    'rich:guests:commentPlaceholder': `
        <textarea
          id="newComment"
          name="comment"
          placeholder="Schreibe deinen Kommentar..."
          rows="3"
          maxlength="500"
        ></textarea>
       `,
    'guests:postComment': 'Veröffentlichen',
  
    'guests:welcome': 'Willkommen',
    
    // Menu Selection Page
    'guests:menuLoading': 'Lade Menü...',
    'guests:menuErrorTitle': 'Fehler beim Laden des Menüs',
    'guests:menuErrorMessage': 'Menüdaten können nicht geladen werden. Bitte versuche es später noch einmal.',
    'guests:menuErrorMessage2': 'Beim Laden des Menüs ist ein Problem aufgetreten. Bitte versuche es erneut.',
    'guests:retry': 'Erneut versuchen',
    'guests:courseGroupStarters': 'Vorspeisen',
    'guests:courseGroupMainCourses': 'Hauptgerichte',
    'guests:courseGroupDesserts': 'Desserts',
    'guests:courseGroupDrinks': 'Getränke',
    'guests:selectionRequired': 'Auswahl erforderlich',
    'guests:infoOnly': 'Nur Information',
    'guests:whosHavingThis': 'Wer nimmt dieses Gericht?',
    'guests:selectedCount': 'ausgewählt',
    'guests:dietaryRequirementsTitle': 'Ernährungsbedürfnisse & Sonderwünsche',
    'guests:dietaryRequirementsDescription': 'Bitte teile uns die Ernährungsbedürfnisse oder Allergien jedes Gastes mit.',
    'guests:dietaryVegetarian': 'Vegetarisch',
    'guests:dietaryLactose Intolerant': 'Laktoseintolerant',
    'guests:dietaryGluten Intolerant': 'Glutenunverträglichkeit',
    'guests:dietaryNut Allergy': 'Nussallergie',
    'guests:dietaryOther': 'Sonstiges',
    'guests:additionalDetailsLabel': 'Weitere Details oder spezielle Anforderungen:',
    'guests:additionalDetailsPlaceholder': 'Bitte beschreibe besondere Ernährungsbedürfnisse, Allergien oder andere spezielle Anforderungen...',
    'guests:saveMenuSelections': 'Menüauswahlen speichern',
    'rich:guests:saveDietaryRequirements': '<i class="fas fa-save"></i> Ernährungsbedürfnisse speichern',
    
    // Gifts Page
    'guests:giftsPageTitle': 'Geschenkeliste',
    'guests:giftsPageDescription': 'Deine Anwesenheit ist unser Geschenk. Wenn du dennoch zu unserer Flitterreise beitragen möchtest, kannst du unten ein lustiges Geschenk auswählen. Es wird mit deiner Nachricht gedruckt und auf einer großen Wand beim Hochzeitsbankett ausgestellt. Der von dir gewählte Geldbetrag wird zur Finanzierung unserer Flitterreise verwendet. Vielen Dank!',
    'guests:giftsLoading': 'Lade Geschenke...',
    'guests:giftsThankYouTitle': 'Vielen Dank für deine Großzügigkeit!',
    'guests:giftsThankYouMessage': 'Wir sind dir für deine wunderbaren Geschenke sehr dankbar',
    'rich:guests:giftsDonatedOn': 'Gespendet am {{date}}',
    'guests:giftsRegistryTitle': 'Geschenkliste',
    'guests:giftsRegistrySubtitle': 'Wähle aus unseren sorgfältig ausgewählten Geschenken',
    'guests:giftsNoAvailable': 'Keine Geschenke verfügbar',
    'guests:giftsNoAvailableDescription': 'Bitte schaue später noch einmal in unsere Geschenkliste.',
    'guests:giftsAvailable': 'verfügbar',
    'guests:giftsSoldOut': 'Ausverkauft',
    'guests:giftsBuyGift': 'Geschenk kaufen',
    'guests:giftsPaymentSuccess': 'Vielen Dank für dein Geschenk! Deine Zahlung war erfolgreich.',
    'guests:giftsPaymentCancelled': 'Die Zahlung wurde abgebrochen.',
    'guests:giftsErrorLoading': 'Fehler beim Laden der Geschenke',
    'guests:giftsErrorLoadingDescription': 'Beim Laden der Geschenke ist ein Problem aufgetreten. Bitte versuche es erneut.',
    'guests:giftsRetry': 'Erneut versuchen',
    'guests:giftsPurchaseTitle': 'Geschenk kaufen',
    'guests:giftsPurchaseAbout': 'Du bist dabei, folgendes zu kaufen:',
    'guests:giftsPurchaseMessageLabel': 'Persönliche Nachricht hinzufügen (optional):',
    'guests:giftsPurchaseMessagePlaceholder': 'Schreibe eine schöne Nachricht für das Paar...',
    'guests:giftsPurchaseCancel': 'Abbrechen',
    'guests:giftsPurchaseProceed': 'Zur Zahlung fortfahren',
    'guests:giftsPurchaseProcessing': 'Verarbeite...',
    'guests:giftsPaymentError': 'Fehler bei der Zahlungsabwicklung',
    'guests:giftsPaymentServiceError': 'Fehler bei der Verbindung zum Zahlungsdienst',
  
  
    // Admin
    'admin:pageTitle': 'Adminbereich - Hochzeit von Iluminada & George',
    'admin:title': 'Adminbereich',
    'admin:logout': 'Abmelden',
    'admin:welcomeTitle': 'Willkommen, Administrator',
    'admin:welcomeDesc': 'Verwalte alle Hochzeitsinformationen für Iluminada und George',
    'admin:tab.guests': 'Gäste',
    'admin:tab.gifts': 'Geschenkliste',
    'admin:tab.messages': 'Nachrichten',
    'admin:tab.events': 'Veranstaltungskalender',
    'admin:tab.menus': 'Menüverwaltung',
    'admin:tab.settings': 'Einstellungen',
    'admin:loading': 'Lade...',
    'admin:uploadingGuests': 'Lade Gäste hoch...',
    'admin:loadingPartyMembers': 'Lade Gruppenmitglieder...',
    'admin:loadingGiftList': 'Lade Geschenkliste...',
    'admin:loadingMessages': 'Lade Nachrichten...',
    'admin:loadingEventSchedule': 'Lade Veranstaltungskalender...',
    'admin:loadingCourses': 'Lade Gänge...',
    'admin:loadingSettings': 'Lade Einstellungen...',
    'admin:footer': 'Adminbereich',
  
    // Admin Messages Section
    'admin:messages.title': 'Nachrichtenbereinigung',
    'admin:messages.subtitle': 'Lösche Nachrichten von Gästen, die unangebracht oder anstößig sind',
    'admin:messages.noMessages': 'Noch keine Nachrichten. Gäste erscheinen hier, sobald sie Kommentare schreiben.',
    'admin:messages.loading': 'Lade Nachrichten...',
    'admin:messages.errorTitle': 'Fehler beim Laden der Nachrichten',
    'admin:messages.errorMessage': 'Nachrichten konnten nicht geladen werden: {{error}}',
    'admin:messages.retry': 'Erneut versuchen',
    'admin:messages.delete': 'Löschen',
  
    // Admin Guests Section
    'admin:guests.errorLoading': 'Gäste konnten nicht geladen werden',
    'admin:guests.adult': 'Erwachsener',
    'admin:guests.child': 'Kind',
    'admin:guests.totalGuests': 'Gesamtzahl der Gäste',
    'admin:guests.acrossParties': 'Verteilt auf {{count}} {{partyWord}}',
    'admin:guests.addGuest': 'Gast hinzufügen',
    'admin:guests.bulkUploadCsv': 'CSV-Sammelimport',
    'admin:guests.table.email': 'E-Mail',
    'admin:guests.table.partySize': 'Gruppengröße',
    'admin:guests.table.actions': 'Aktionen',
    'admin:guests.confirmDelete': 'Diesen Gast und seine gesamte Gruppe löschen?',
    'admin:guests.editTitle': 'Gast bearbeiten',
    'admin:guests.addTitle': 'Gast hinzufügen',
    'admin:guests.save': 'Speichern',
    'admin:guests.add': 'Hinzufügen',
    'admin:guests.field.name': 'Name',
    'admin:guests.field.email': 'E-Mail',
    'admin:guests.field.ageCategory': 'Alterskategorie',
    'admin:guests.option.adult': 'Erwachsener (18+)',
    'admin:guests.option.child': 'Kind (unter 18)',
    'admin:guests.csv.noValidGuests': 'Keine gültigen Gäste in der CSV-Datei gefunden',
    'admin:guests.csv.uploadCount': '{{count}} Gäste importieren?',
    'admin:guests.csv.preview': 'Vorschau:',
    'admin:guests.csv.more': '... und {{count}} weitere',
    'admin:guests.csv.uploadComplete': 'Import abgeschlossen!',
    'admin:guests.csv.successCreated': 'Erfolgreich erstellt: {{count}}',
    'admin:guests.csv.skippedDuplicates': 'Übersprungen (Duplikate/leer): {{count}}',
    'admin:guests.csv.errors': 'Fehler: {{count}}',
    'admin:guests.csv.firstError': 'Erster Fehler: {{error}}',
    'admin:guests.csv.uploadingError': 'Fehler beim Hochladen der CSV: {{error}}',
    'admin:guests.error.title': 'Fehler beim Laden der Gäste',
    'admin:guests.error.failed': 'Gäste konnten nicht geladen werden: {{error}}',
    'admin:guests.retry': 'Erneut versuchen',
  
    // Admin Gifts Section
    'admin:gifts.title': 'Geschenkliste',
    'admin:gifts.add': 'Hinzufügen',
    'admin:gifts.edit': 'Geschenk bearbeiten',
    'admin:gifts.save': 'Speichern',
    'admin:gifts.deleteConfirm': 'Dieses Geschenk löschen?',
    'admin:gifts.noImage': 'Kein Bild',
    'admin:gifts.grandTotal': 'Gesamtsumme',
    'admin:gifts.grandTotalDescription': 'Verfügbare Karten x Preis',
    'admin:gifts.table.description': 'Beschreibung',
    'admin:gifts.table.image': 'Bild',
    'admin:gifts.table.available': 'Verfügbar',
    'admin:gifts.table.price': 'Preis',
    'admin:gifts.table.purchased': 'Gekauft',
    'admin:gifts.table.actions': 'Aktionen',
    'admin:gifts.field.title': 'Name',
    'admin:gifts.field.description': 'Beschreibung',
    'admin:gifts.field.image': 'Bild',
    'admin:gifts.field.available': 'Verfügbare Anzahl',
    'admin:gifts.field.price': 'Preis',
    'admin:gifts.field.imageHelp': 'Bild der Geschenkkarte hochladen (wird in der Datenbank gespeichert)',
    'admin:gifts.priceOption.25': '25 €',
    'admin:gifts.priceOption.50': '50 €',
    'admin:gifts.priceOption.100': '100 €',
    'admin:gifts.priceOption.200': '200 €',
    'admin:gifts.priceOption.500': '500 €',
  
    // Admin Settings Section
    'admin:settings.title': 'Einstellungen',
    'admin:settings.featureToggles': 'Funktionen',
    'admin:settings.featureTogglesDescription': 'Steuere, welche Funktionen für Gäste verfügbar sind',
    'admin:settings.enableGuestArea': 'Gästebereich aktivieren',
    'admin:settings.enableGuestAreaDesc': 'Gästen erlauben, sich anzumelden und ihre Gruppe zu verwalten',
    'admin:settings.showWeddingEvents': 'Hochzeitsveranstaltungen anzeigen',
    'admin:settings.showWeddingEventsDesc': 'Den Veranstaltungskalender anzeigen und Gästen erlauben, ihre Teilnahme zu bestätigen',
    'admin:settings.menu': 'Menü',
    'admin:settings.menuDesc': 'Menüauswahl und Präferenzen der Gäste anzeigen',
    'admin:settings.messages': 'Nachrichten',
    'admin:settings.messagesDesc': 'Nachrichten anzeigen',
    'admin:settings.gifts': 'Geschenke',
    'admin:settings.giftsDesc': 'Geschenkliste anzeigen',
  
    // Admin Party Management Section
    'admin:party.title': 'Gruppe verwalten: ',
    'admin:party.description': 'Gruppenmitglieder für diesen Gast verwalten',
    'admin:party.backToGuests': 'Zurück zu den Gästen',
    'admin:party.unknown': 'Unbekannt',
    'admin:party.partyMembers': 'Gruppenmitglieder',
    'admin:party.addMember': 'Mitglied hinzufügen',
    'admin:party.noMembers': 'Noch keine Gruppenmitglieder hinzugefügt.',
    'admin:party.table.name': 'Name',
    'admin:party.table.ageGroup': 'Altersgruppe',
    'admin:party.table.actions': 'Aktionen',
    'admin:party.addModalTitle': 'Gruppenmitglied hinzufügen',
    'admin:party.add': 'Hinzufügen',
    'admin:party.field.name': 'Name',
    'admin:party.field.ageGroup': 'Altersgruppe',
    'admin:party.option.adult': 'Erwachsener (18+)',
    'admin:party.option.child': 'Kind (unter 18)',
    'admin:party.editModalTitle': 'Gruppenmitglied bearbeiten',
    'admin:party.save': 'Speichern',
    'admin:party.confirmRemove': 'Dieses Gruppenmitglied entfernen?',
    'admin:party.error.title': 'Fehler beim Laden der Gruppe',
    'admin:party.error.failed': 'Gruppenmitglieder konnten nicht geladen werden: {{error}}',
    'admin:party.error.loadFailed': 'Gruppenmitglieder konnten nicht geladen werden',
    'admin:party.error.addFailed': 'Gruppenmitglied konnte nicht hinzugefügt werden',
    'admin:party.error.removeFailed': 'Gruppenmitglied konnte nicht entfernt werden',
    'admin:party.error.updateFailed': 'Gruppenmitglied konnte nicht aktualisiert werden',
    'admin:party.error.loadingError': 'Fehler beim Laden der Gruppenmitglieder: {{error}}',
    'admin:party.retry': 'Erneut versuchen',
  
    // Admin Events Section
    'admin:events.title': 'Veranstaltungskalender',
    'admin:events.addEvent': 'Veranstaltung hinzufügen',
    'admin:events.noImage': 'Kein Bild',
    'admin:events.confirmDelete': 'Diese Veranstaltung löschen?',
    'admin:events.errorDeleting': 'Fehler beim Löschen der Veranstaltung',
    'admin:events.modal.addTitle': 'Veranstaltung hinzufügen',
    'admin:events.modal.editTitle': 'Veranstaltung bearbeiten',
    'admin:events.add': 'Hinzufügen',
    'admin:events.save': 'Speichern',
    'admin:events.table.name': 'Name',
    'admin:events.table.date': 'Datum',
    'admin:events.table.startTime': 'Beginn',
    'admin:events.table.endTime': 'Ende',
    'admin:events.table.title': 'Titel',
    'admin:events.table.image': 'Bild',
    'admin:events.table.actions': 'Aktionen',
    'admin:events.field.name': 'Name',
    'admin:events.field.nameHelp': 'z. B. Trauung',
    'admin:events.field.date': 'Datum',
    'admin:events.field.dateHelp': 'Datum der Veranstaltung (Spanien-Format)',
    'admin:events.field.startTime': 'Beginn',
    'admin:events.field.startTimeHelp': 'Beginn (24-Stunden-Format)',
    'admin:events.field.endDate': 'Endedatum',
    'admin:events.field.endDateHelp': 'Endedatum (optional, für mehrtägige Veranstaltungen)',
    'admin:events.field.endTime': 'Ende',
    'admin:events.field.endTimeHelp': 'Ende (24-Stunden-Format, kann am nächsten Tag sein, wenn ein Enddatum gesetzt ist)',
    'admin:events.field.location': 'Ort',
    'admin:events.field.locationHelp': 'Nutze das Karten-Tool, um den genauen Ort auszuwählen',
    'admin:events.field.title': 'Titel',
    'admin:events.field.titleHelp': 'z. B. Oyana Beach Restaurant',
    'admin:events.field.description': 'Beschreibung',
    'admin:events.field.descriptionHelp': 'Beschreibung der Veranstaltung oder zusätzliche Details',
    'admin:events.field.image': 'Bild',
    'admin:events.field.imageHelp': 'Bild der Veranstaltung hochladen (wird in der Datenbank gespeichert)',
    'admin:events.error.create': 'Veranstaltung konnte nicht erstellt werden',
    'admin:events.error.update': 'Veranstaltung konnte nicht aktualisiert werden',
  
    // Admin Sub-events Section
    'admin:subEvents.manageTitle': 'Unterveranstaltungen verwalten: {{eventName}}',
    'admin:subEvents.close': 'Schließen',
    'admin:subEvents.addSubEvent': 'Unterveranstaltung hinzufügen',
    'admin:subEvents.noSubEvents': 'Noch keine Unterveranstaltungen',
    'admin:subEvents.deleteConfirm': 'Diese Unterveranstaltung löschen?',
    'admin:subEvents.addTitle': 'Unterveranstaltung hinzufügen',
    'admin:subEvents.editTitle': 'Unterveranstaltung bearbeiten',
    'admin:subEvents.add': 'Hinzufügen',
    'admin:subEvents.save': 'Speichern',
    'admin:subEvents.field.name': 'Name',
    'admin:subEvents.field.nameHelp': 'z. B. Willkommenscocktail',
    'admin:subEvents.field.date': 'Datum',
    'admin:subEvents.field.startTime': 'Beginn',
    'admin:subEvents.field.endTime': 'Ende',
    'admin:subEvents.field.description': 'Beschreibung',
    'admin:subEvents.field.descriptionHelp': 'z. B. Cocktails und Häppchen am Brunnen genießen und andere Gäste kennenlernen',
    'admin:subEvents.field.icon': 'Icon',
    'admin:subEvents.option.ceremony': 'Zeremonie',
    'admin:subEvents.option.cocktails': 'Cocktails',
    'admin:subEvents.option.reception': 'Empfang',
    'admin:subEvents.option.dancing': 'Tanz',
  
    // Admin Menu Management Section
    'admin:menu.title': 'Menüverwaltung',
    'admin:menu.courseType.starter': 'Vorspeisen',
    'admin:menu.courseType.main': 'Hauptgerichte',
    'admin:menu.courseType.dessert': 'Desserts',
    'admin:menu.courseType.drinks': 'Getränke',
    'admin:menu.noOptionsDefined': 'Keine Optionen definiert',
    'admin:menu.emptyCourse': 'Noch keine {{courseType}} definiert.',
    'admin:menu.errorLoading': 'Fehler beim Laden des Menüs',
    'admin:menu.failedToLoad': 'Menü konnte nicht geladen werden: {{error}}',
    'admin:menu.retry': 'Erneut versuchen',
    'admin:menu.confirmDelete': 'Diesen Menüteil löschen? Dadurch werden alle zugehörigen Optionen entfernt.',
    'admin:menu.confirmDeleteOption': 'Diese Menüoption löschen?',
    'admin:menu.errorDeleting': 'Fehler beim Löschen des Menü­teils',
    'admin:menu.errorDeletingOption': 'Fehler beim Löschen der Menüoption',
    'admin:menu.editCourse': 'Gang bearbeiten',
    'admin:menu.addCourse': 'Gang hinzufügen',
    'admin:menu.save': 'Speichern',
    'admin:menu.add': 'Hinzufügen',
    'admin:menu.field.courseType': 'Gangtyp',
    'admin:menu.field.courseLabel': 'Bezeichnung des Gangs',
    'admin:menu.field.selectionRequired': 'Auswahl erforderlich',
    
    'admin:menu.option.starter': 'Vorspeise',
    'admin:menu.option.main': 'Hauptgericht',
    'admin:menu.option.dessert': 'Dessert',
    'admin:menu.option.drinks': 'Getränke',
    'admin:menu.option.yes': 'Ja – Gäste müssen eine Option wählen',
    'admin:menu.option.no': 'Nein – Alle Optionen werden angeboten',
    'admin:menu.field.courseLabelHelp': 'z. B. „Vorspeisen“, „Hauptgang“, „Desserts“',
  
    'admin:menu.field.helpSelectionRequired': 'Wenn aktiviert, müssen Gäste eine Option auswählen. Wenn deaktiviert, werden alle Optionen serviert.',
    'admin:menu.editCourseOption': 'Menüoption bearbeiten',
    'admin:menu.addCourseOption': 'Menüoption hinzufügen',
    'admin:menu.field.option': 'Option',
    'admin:menu.field.optionHelp': 'z. B. Cremige Pilzsuppe',
    'admin:menu.field.optionDescription': 'Beschreibung der Option',
    'admin:menu.field.optionDescriptionHelp': 'z. B. Eine feine Mischung aus Sahne, Pilzen und Knoblauch',
    'admin:menu.field.image': 'Bild',
    'admin:menu.field.imageHelp': 'Bild der Menüoption hochladen (wird in der Datenbank gespeichert)',
    'admin:menu.field.isVegetarian': 'Vegetarisch',
    'admin:menu.field.containsAllergens': 'Enthält Allergene',
    'admin:menu.field.containsLactose': 'Enthält Laktose',
    'admin:menu.field.isSpicy': 'Scharf',
    'admin:menu.field.containsNuts': 'Enthält Nüsse',
    'admin:menu.field.helpVegetarian': 'Diese Option ist für Vegetarier geeignet',
    'admin:menu.field.helpAllergens': 'Diese Option enthält Allergene – bitte Zutatenliste prüfen',
    'admin:menu.field.helpLactose': 'Diese Option enthält Laktose/Milchprodukte',
    'admin:menu.field.helpSpicy': 'Diese Option enthält scharfe Zutaten',
    'admin:menu.field.helpNuts': 'Diese Option kann Nüsse enthalten',
  
    'adminLogin:pageTitle': 'Admin-Login - Hochzeit von Iluminada & George',
    'adminLogin:subHeader': 'Zum Adminbereich',
    'adminLogin:description': 'Gib deine Zugangsdaten ein, um Hochzeitsdetails und RSVPs zu verwalten.',
    'adminLogin:username': 'Benutzername',
    'adminLogin:usernamePlaceholder': 'Dein Benutzername',
    'adminLogin:password': 'Passwort',
    'adminLogin:passwordPlaceholder': 'Dein geheimes Passwort',
    'adminLogin:submit': 'Anmelden',
  
    'common:advancedFeatures': 'Beispiele für erweiterte Funktionen',
    'common:numberFormatting': 'Zahlenformatierung',
    'common:price': 'Preis',
    'common:percentage': 'Prozentsatz',
    'common:dateFormatting': 'Datumsformatierung',
    'common:currentDate': 'Aktuelles Datum',
    'common:currentTime': 'Aktuelle Uhrzeit',
    'common:currencyFormatting': 'Währungsformatierung',
    'common:gift': 'Geschenk',
  }
};

// Language Configuration
const languages = {
  es: { name: 'Español', flag: '🇪🇸', rtl: false },
  en: { name: 'English', flag: '🇬🇧', rtl: false },
  fr: { name: 'Français', flag: '🇫🇷', rtl: false },
  de: { name: 'Deutsch', flag: '🇩🇪', rtl: false },
};

// Initialize current language - check localStorage first, then browser preferences, fallback to 'es'
let currentLanguage = detectAndSetBrowserLanguage();

function translate(key, lang = currentLanguage) {
  const translation = translations[lang]?.[key];
  return translation || key;
}

// Translation helper function for variable substitution
function translateWithVars(key, vars = {}) {
  let translation = translate(key);
  for (const [varName, varValue] of Object.entries(vars)) {
    translation = translation.replace(new RegExp(`{{${varName}}}`, 'g'), varValue);
  }
  return translation;
}

// Global function to localise strings or LocalizedString objects
function localize(textOrLocalizedString, lang = currentLanguage) {
  // If it's a regular string, return it as-is
  if (typeof textOrLocalizedString === 'string') {
    return textOrLocalizedString;
  }
  
  // If it's a LocalizedString (Map), get the appropriate translation
  if (textOrLocalizedString instanceof Map || 
      (typeof textOrLocalizedString === 'object' && textOrLocalizedString !== null)) {
    
    // Try to get the translation for the current language
    const currentTranslation = textOrLocalizedString.get ? 
      textOrLocalizedString.get(lang) : 
      textOrLocalizedString[lang];
    
    // If current language translation exists and is not empty, return it
    if (currentTranslation && currentTranslation.trim() !== '') {
      return currentTranslation;
    }
    
    // Otherwise, find the first non-empty string
    if (textOrLocalizedString instanceof Map) {
      for (const value of textOrLocalizedString.values()) {
        if (value && value.trim() !== '') {
          return value;
        }
      }
    } else {
      // Handle as plain object
      for (const key in textOrLocalizedString) {
        if (textOrLocalizedString.hasOwnProperty(key) && 
            textOrLocalizedString[key] && 
            textOrLocalizedString[key].trim() !== '') {
          return textOrLocalizedString[key];
        }
      }
    }
    
    // If all translations are empty or missing, return empty string
    return '';
  }
  
  // Fallback for any other type
  return String(textOrLocalizedString || '');
}

function toLocalizedString(value, lang = currentLanguage) {
  if (!value) return {};
  if (typeof value === 'string') {
    return { [lang]: value };
  }
  // Already a LocalizedString-ish object
  return value;
}

function updatePageContent() {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const isRich = key.startsWith('rich:');
    const translation = translate(key);

    if (translation !== key) {
      if (isRich) {
        element.innerHTML = translation;   // render HTML
      } else {
        element.textContent = translation; // plain text
      }
    }
  });
}

function updateLanguageSelector() {
  const toggle = document.getElementById('language-toggle');
  const currentLang = languages[currentLanguage];
  
  if (toggle) {
    toggle.innerHTML = `
      <span class="current-language">
        <span class="flag">${currentLang.flag}</span>
        <span class="name">${currentLang.name}</span>
      </span>
      <i class="fas fa-chevron-down"></i>
    `;
  }
  
  // Update active options
  document.querySelectorAll('.language-option').forEach(option => {
    const lang = option.getAttribute('data-lang');
    if (lang === currentLanguage) {
      option.classList.add('active');
    } else {
      option.classList.remove('active');
    }
  });
}

function updateDocumentDirection() {
  const isRTL = languages[currentLanguage].rtl;
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = currentLanguage;
}

async function changeLanguage(lang) {
  if (!languages[lang]) {
    console.warn(`Language ${lang} is not supported`);
    return false;
  }

  try {
    currentLanguage = lang;
    
    // Save preference
    localStorage.setItem('i18nextLng', lang);
    
    // Update document direction
    updateDocumentDirection();
    
    // Update content
    updatePageContent();
    
    // Update selector
    updateLanguageSelector();
    
    // Update formatting
    updateFormatting();
    
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
            
    console.log(`Language changed to: ${lang}`);
    return true;
  } catch (error) {
    console.error(`Error changing language: ${error.message}`);
    return false;
  }
}

function detectAndSetBrowserLanguage() {
  // Check if language is already set in localStorage
  const savedLanguage = localStorage.getItem('i18nextLng');
  if (savedLanguage) {
    console.log(`Language already set to: ${savedLanguage}`);
    return savedLanguage;
  }

  // Get browser's preferred languages
  const browserLanguages = [
    navigator.language,
    navigator.languages?.[0],
    navigator.userLanguage,
    navigator.browserLanguage
  ].filter(Boolean); // Remove undefined values

  console.log('Browser preferred languages:', browserLanguages);

  // Map browser languages to supported languages
  const languageMap = {
    // Spanish variants
    'es': 'es', 'es-ES': 'es', 'es-MX': 'es', 'es-AR': 'es', 'es-CO': 'es', 'es-PE': 'es', 
    'es-VE': 'es', 'es-CL': 'es', 'es-UY': 'es', 'es-PY': 'es', 'es-BO': 'es', 'es-EC': 'es',
    'es-CR': 'es', 'es-PA': 'es', 'es-NI': 'es', 'es-HN': 'es', 'es-GT': 'es', 'es-SV': 'es',
    'es-DO': 'es', 'es-PR': 'es', 'es-CU': 'es',
    
    // English variants  
    'en': 'en', 'en-US': 'en', 'en-GB': 'en', 'en-CA': 'en', 'en-AU': 'en', 'en-NZ': 'en',
    'en-IE': 'en', 'en-ZA': 'en', 'en-IN': 'en', 'en-SG': 'en', 'en-HK': 'en',
    
    // French variants
    'fr': 'fr', 'fr-FR': 'fr', 'fr-CA': 'fr', 'fr-BE': 'fr', 'fr-CH': 'fr', 'fr-LU': 'fr',
    'fr-MC': 'fr', 'fr-DZ': 'fr', 'fr-MA': 'fr', 'fr-TN': 'fr', 'fr-SN': 'fr', 'fr-ML': 'fr',
    'fr-BF': 'fr', 'fr-NE': 'fr', 'fr-CI': 'fr', 'fr-CM': 'fr', 'fr-CD': 'fr', 'fr-CG': 'fr',
    'fr-GA': 'fr', 'fr-GQ': 'fr', 'fr-VU': 'fr', 'fr-PM': 'fr', 'fr-WF': 'fr', 'fr-YT': 'fr',
    'fr-PF': 'fr', 'fr-NC': 'fr', 'fr-RE': 'fr', 'fr-MF': 'fr', 'fr-GP': 'fr', 'fr-MQ': 'fr',
    'fr-GF': 'fr',
  
    // German variants
    'de': 'de', 'de-DE': 'de', 'de-AT': 'de', 'de-CH': 'de', 'de-LU': 'de', 'de-LI': 'de'
  };
  

  // Try to find a supported language from browser preferences
  for (const browserLang of browserLanguages) {
    const normalizedLang = browserLang.toLowerCase();
    
    // Try exact match first
    if (languageMap[normalizedLang]) {
      const supportedLang = languageMap[normalizedLang];
      localStorage.setItem('i18nextLng', supportedLang);
      console.log(`Browser language detected and set to: ${supportedLang} (from: ${browserLang})`);
      return supportedLang;
    }
    
    // Try base language match (e.g., 'en-US' -> 'en')
    const baseLang = normalizedLang.split('-')[0];
    if (languageMap[baseLang]) {
      const supportedLang = languageMap[baseLang];
      localStorage.setItem('i18nextLng', supportedLang);
      console.log(`Browser base language detected and set to: ${supportedLang} (from: ${browserLang})`);
      return supportedLang;
    }
  }

  // Fallback to default language if no match found
  const defaultLanguage = 'es';
  localStorage.setItem('i18nextLng', defaultLanguage);
  console.log(`No matching browser language found, using default: ${defaultLanguage}`);
  return defaultLanguage;
}

function updateFormatting() {
  try {
    // Formatting numbers
    const priceElement = document.getElementById('formatted-price');
    const percentageElement = document.getElementById('formatted-percentage');
    
    if (priceElement) {
      priceElement.textContent = new Intl.NumberFormat(currentLanguage, { 
        style: 'decimal', 
        minimumFractionDigits: 2 
      }).format(1000);
    }
    
    if (percentageElement) {
      percentageElement.textContent = new Intl.NumberFormat(currentLanguage, { 
        style: 'percent', 
        minimumFractionDigits: 1 
      }).format(0.855);
    }
    
    // Formatting dates
    const dateElement = document.getElementById('formatted-date');
    const timeElement = document.getElementById('formatted-time');
    const now = new Date();
    
    if (dateElement) {
      dateElement.textContent = new Intl.DateTimeFormat(currentLanguage, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }).format(now);
    }
    
    if (timeElement) {
      timeElement.textContent = new Intl.DateTimeFormat(currentLanguage, { 
        hour: '2-digit', 
        minute: '2-digit' 
      }).format(now);
    }
    
    // Formatting currency
    const currencyElement = document.getElementById('formatted-currency');
    if (currencyElement) {
      const currency = currentLanguage === 'en' ? 'USD' : 'EUR';
      currencyElement.textContent = new Intl.NumberFormat(currentLanguage, {
        style: 'currency',
        currency: currency
      }).format(150);
    }
  } catch (error) {
    console.error('Error updating formatting:', error);
  }
}
