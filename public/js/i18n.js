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
  fr: {},
  de: {},
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
