/* Claire TOEIC — fixed practice sets with a verified answer key.
 * Grading is deterministic (no LLM): each item has exactly one correct option.
 * Listening Part 2 is read aloud through the portal's Claire voice; text stays hidden until answered (like the real test).
 */
(function (global) {
  'use strict';

  // [question, [correct, wrong, wrong], why]  — the first option is always the correct one; options are shuffled on screen.
  var L2 = [
    ["When is the quarterly report due?", ["By the end of the day on Friday.", "Yes, I filed it last week.", "In the conference room on the third floor."], "A 'When' question needs a time or a deadline."],
    ["Who's presenting at tomorrow's staff meeting?", ["Sarah from marketing is.", "It starts at nine o'clock.", "Yes, the agenda looks good."], "A 'Who' question needs a person."],
    ["Where should I put these boxes?", ["Next to the copy machine, please.", "They arrived this morning.", "Yes, they're quite heavy."], "A 'Where' question needs a place."],
    ["Why was the shipment delayed?", ["There was a problem at the warehouse.", "By express mail.", "Twelve boxes in total."], "A 'Why' question needs a reason."],
    ["How long will the training session last?", ["About two hours.", "In Room 204.", "Ms. Patel is leading it."], "'How long' asks for a length of time."],
    ["Would you like me to book a taxi for you?", ["Thanks, that would be great.", "It was a long flight.", "The book is on my desk."], "This is an offer, so accepting it is the natural reply. 'Book' as a noun is a sound trap."],
    ["Didn't you send the invoice yesterday?", ["Yes, I emailed it in the afternoon.", "An invoice for office supplies.", "Her voice was very clear."], "A yes/no question: 'Yes' plus a detail answers it. 'Voice' is a sound trap."],
    ["Which printer is working right now?", ["The one by the reception desk.", "I'll print two copies.", "Since last Monday."], "'Which' asks you to identify one item."],
    ["Can you help me move this desk?", ["Sure, just give me a minute.", "It's a wooden desk.", "They moved last year."], "A request: agreeing to help is the logical reply."],
    ["What time does the store open on Saturdays?", ["At ten a.m.", "On Main Street.", "Saturdays are busy."], "'What time' needs a clock time."],
    ["Have you met our new manager yet?", ["No, not yet, but I'm looking forward to it.", "The meeting was canceled.", "He manages the sales team."], "A yes/no question about an experience: 'No, not yet' answers it. 'Meeting' and 'manages' are word traps."],
    ["Should we take the train or drive to the conference?", ["The train would be faster.", "It's a three-day conference.", "Yes, we should."], "An either/or question needs a choice, never 'yes' or 'no'."],
    ["Whose jacket is this on the chair?", ["I think it's Mr. Lee's.", "It's raining outside.", "On the back of the door."], "'Whose' asks who owns something."],
    ["How much does the new software cost?", ["About three hundred dollars per license.", "It's very easy to use.", "We installed it last week."], "'How much' asks for a price."],
    ["Why don't we order lunch for the team?", ["Good idea. I'll call the restaurant.", "Because I was late.", "At the cafeteria."], "'Why don't we…' is a suggestion, not a real 'why' question. Don't answer with 'because'."],
    ["Is the elevator working again?", ["Yes, the technician fixed it this morning.", "On the fifth floor.", "I work on Tuesdays."], "A yes/no question: 'Yes' plus the reason. 'Work' is a word trap."],
    ["Where can I find visitor parking?", ["Behind the main building.", "Park the car carefully.", "For about an hour."], "'Where' needs a place."],
    ["When did Ms. Garcia join the company?", ["About five years ago.", "She works in accounting.", "Yes, she did."], "'When' + past tense needs a past time."],
    ["Could you send me the meeting notes?", ["I'll email them right after lunch.", "The notes are very long.", "We met on Monday."], "A polite request: saying when you will do it is a natural reply."],
    ["Who's responsible for ordering office supplies?", ["That's Kevin's job.", "Paper, pens and toner.", "Every two weeks."], "'Who' needs a person."],
    ["How often do you back up the files?", ["Every Friday afternoon.", "In the shared folder.", "Back to the office."], "'How often' asks for frequency."],
    ["Why is the conference room locked?", ["There's a private meeting until three.", "It has twenty chairs.", "The key is small."], "'Why' needs a reason."],
    ["Do you know where the stapler is?", ["Try the top drawer of my desk.", "Yes, I know him.", "Two pages, please."], "An indirect 'where' question: the useful answer gives the location."],
    ["Which flight are you taking to Chicago?", ["The six p.m. flight.", "It was a smooth flight.", "Chicago is very cold in winter."], "'Which' asks you to choose one specific flight."],
    ["Would you prefer a window seat or an aisle seat?", ["An aisle seat, please.", "Yes, I would.", "The window is open."], "An either/or question needs a choice, not 'yes'."],
    ["When will the renovations be finished?", ["By the end of next month.", "The lobby and the kitchen.", "A local construction company."], "'When' needs a time."],
    ["Isn't the client arriving at two?", ["No, her flight was moved to four.", "Two cups of coffee, please.", "She's a new client."], "A negative yes/no question: 'No' plus the new time answers it."],
    ["How did the presentation go?", ["Very well. The clients loved it.", "In the main auditorium.", "I'll present it tomorrow."], "'How did it go' asks about the result."],
    ["Where's the nearest bank?", ["Two blocks down, on the left.", "I opened an account.", "It closes at five."], "'Where' needs a place."],
    ["Who should I give this report to?", ["Leave it with the department head.", "It's twenty pages long.", "Yes, please report it."], "'Who' needs a person."],
    ["Why did sales drop last quarter?", ["Mostly because of a new competitor.", "The sales team is very large.", "Last quarter ended in March."], "'Why' needs a reason."],
    ["Can I borrow your laptop charger?", ["Sure, it's in my bag.", "The battery is new.", "I borrowed a book."], "A request: agreeing is natural. 'Borrowed' is a word trap."],
    ["What's the password for the guest Wi-Fi?", ["It's printed on the card at the front desk.", "The signal is strong.", "Yes, I'm a guest."], "Telling the person where to find the password answers the question."],
    ["Are you coming to the retirement party on Friday?", ["Yes, I wouldn't miss it.", "He's retiring after thirty years.", "The party was fun."], "A yes/no question about the future: 'Yes' answers it. 'The party was fun' is the wrong tense."],
    ["How many people signed up for the workshop?", ["About forty so far.", "It's a writing workshop.", "Sign here, please."], "'How many' needs a number."],
    ["When are you leaving for your vacation?", ["Next Thursday morning.", "To Costa Rica.", "For two weeks."], "'When' needs a time, not a place or a length of time."],
    ["Who left these documents on the printer?", ["I think it was Ana from HR.", "Twelve copies.", "Leave them there."], "'Who' needs a person."],
    ["Why don't you take the afternoon off?", ["Thanks, I think I will.", "Because it's off.", "In the afternoon."], "'Why don't you…' is a suggestion; accepting it is natural."],
    ["Which department handles customer complaints?", ["Customer Service, on the second floor.", "The customer was happy.", "We handled it yesterday."], "'Which' asks you to name the department."],
    ["Hasn't the budget been approved yet?", ["No, the director is still reviewing it.", "It's a large budget.", "Yes, approve it."], "A negative yes/no question: 'No' plus the reason answers it."],
    ["Where did you get that coffee?", ["From the new café across the street.", "With milk, please.", "About ten minutes ago."], "'Where' needs a place."],
    ["How should I send these samples?", ["Use the overnight courier.", "Twenty samples.", "They're very small."], "'How' asks for a method."],
    ["Will the technician come today or tomorrow?", ["He said he'd be here this afternoon.", "Yes, he will.", "The technician is new."], "An either/or question needs a choice. 'This afternoon' means today."],
    ["What did the client say about our proposal?", ["She wants a few changes to the price.", "We proposed it on Monday.", "The client is from Toronto."], "The question asks what the client said."],
    ["Could you turn down the music a little?", ["Of course, sorry about that.", "The music is from Brazil.", "Turn left at the corner."], "A polite request: agreeing and apologizing is natural. 'Turn' is a word trap."]
  ];

  // [sentence with ___, [correct, wrong, wrong, wrong], why]
  var R5 = [
    ["The manager asked the team to submit the report ___ Friday.", ["by", "in", "on", "at"], "'By' means 'no later than' a deadline."],
    ["Ms. Chen has worked at the company ___ 2015.", ["since", "for", "during", "from"], "'Since' + a starting point with the present perfect."],
    ["All employees must wear their ID badges ___ in the building.", ["while", "during", "because", "unless"], "'While (they are) in the building' — 'during' needs a noun."],
    ["The new printer is ___ than the old one.", ["faster", "fast", "fastest", "more fast"], "Comparative with 'than': short adjective + -er."],
    ["Please ___ the attached form and return it by Monday.", ["complete", "completes", "completing", "completed"], "Imperative: base form of the verb."],
    ["The conference was postponed ___ the speaker was ill.", ["because", "despite", "although", "unless"], "A reason clause needs 'because'."],
    ["Neither the director ___ the assistant was available.", ["nor", "or", "and", "but"], "'Neither … nor' is a fixed pair."],
    ["The shipment arrived ___ than expected.", ["earlier", "early", "earliest", "more early"], "Comparative with 'than': 'earlier'."],
    ["If we ___ the contract, we will start in June.", ["sign", "signed", "will sign", "signing"], "First conditional: if + present, will + verb."],
    ["Mr. Ruiz is responsible ___ training new staff.", ["for", "to", "of", "with"], "'Responsible for' + -ing."],
    ["The report was written ___ by the finance team.", ["carefully", "careful", "care", "carefulness"], "An adverb describes how it was written."],
    ["Customers can contact us ___ phone or email.", ["by", "with", "in", "on"], "'By phone / by email' describes the method."],
    ["The meeting will begin as soon as everyone ___.", ["arrives", "arrive", "will arrive", "arriving"], "Time clauses use the present tense; 'everyone' is singular."],
    ["Our sales increased ___ 15 percent last year.", ["by", "to", "of", "at"], "'Increased by' gives the amount of the change."],
    ["The company plans to ___ its operations to Asia.", ["expand", "expanse", "expansive", "expansion"], "After 'to' we need a verb."],
    ["She has ___ finished the presentation.", ["already", "yet", "still", "ever"], "'Already' goes between 'has' and the past participle in affirmative sentences."],
    ["The files must be ___ before the audit.", ["organized", "organize", "organizing", "organizes"], "Passive: be + past participle."],
    ["This is the ___ proposal we have received so far.", ["best", "good", "better", "well"], "Superlative: 'the best … so far'."],
    ["Employees ___ want to attend the workshop should register online.", ["who", "which", "whom", "whose"], "'Who' is the subject pronoun for people."],
    ["The office will be closed ___ the holiday weekend.", ["during", "while", "since", "among"], "'During' + a noun phrase."],
    ["Mr. Tanaka, ___ office is on the fifth floor, will lead the project.", ["whose", "who", "whom", "which"], "'Whose' shows possession (his office)."],
    ["Please let me know ___ you need any help.", ["if", "unless", "so", "although"], "'Let me know if…' is the standard phrase."],
    ["The budget ___ by the board next week.", ["will be reviewed", "will review", "reviews", "reviewing"], "The budget receives the action: future passive."],
    ["We need to hire ___ staff for the busy season.", ["additional", "addition", "additionally", "add"], "An adjective describes the noun 'staff'."],
    ["The training was ___ useful that we plan to repeat it.", ["so", "such", "too", "very"], "'So + adjective + that' shows a result."],
    ["Ms. Lopez prefers to work ___ rather than in a team.", ["independently", "independent", "independence", "independents"], "An adverb describes how she works."],
    ["The CEO thanked the employees ___ their hard work.", ["for", "to", "by", "at"], "'Thank someone for something'."],
    ["Our clients expect fast and ___ service.", ["reliable", "rely", "reliably", "reliability"], "An adjective, parallel to 'fast', describes 'service'."],
    ["The parcel ___ yesterday afternoon.", ["was delivered", "delivers", "is delivering", "has delivered"], "Past passive with 'yesterday'."],
    ["I look forward to ___ from you soon.", ["hearing", "hear", "heard", "be hearing"], "'Look forward to' + -ing."],
    ["The new policy applies to ___ employee in the company.", ["every", "all", "many", "most"], "'Every' + a singular noun."],
    ["Mr. Kim was late ___ the heavy traffic.", ["because of", "because", "although", "despite"], "'Because of' + a noun phrase gives the reason."],
    ["The project must be completed ___ the end of the month.", ["by", "until", "on", "since"], "'By' = no later than; 'until' is for continuing actions."],
    ["There are ___ seats left for the seminar.", ["few", "little", "much", "a little"], "'Few' goes with countable plural nouns."],
    ["The manager ___ the proposal before the meeting started.", ["had reviewed", "has reviewed", "reviews", "will review"], "Past perfect for the earlier of two past actions."],
    ["Ms. Davis is ___ qualified for the position.", ["highly", "high", "higher", "height"], "An adverb modifies the adjective 'qualified'."],
    ["Please keep the receipt ___ you need to return the item.", ["in case", "so that", "even though", "as long"], "'In case' = as a precaution."],
    ["The marketing team ___ a new campaign every quarter.", ["launches", "launch", "launching", "are launch"], "'Team' is singular in the present simple."],
    ["The seminar was canceled ___ low registration.", ["due to", "because", "although", "so"], "'Due to' + a noun phrase gives the cause."],
    ["We are pleased to ___ you that your application was accepted.", ["inform", "say", "tell to", "explain"], "'Inform someone that…'."],
    ["The instructions were clear ___ for everyone to follow.", ["enough", "too", "so", "such"], "'Adjective + enough + for'."],
    ["Each department must submit ___ budget by Friday.", ["its", "it's", "theirs", "them"], "'Each department' is singular: 'its' (possessive). 'It's' means 'it is'."],
    ["The hotel offers a free shuttle service ___ the airport.", ["to", "at", "in", "on"], "Movement toward a place: 'to'."],
    ["Applicants should have at least three years of ___ in sales.", ["experience", "experienced", "experiencing", "experiences"], "'Experience' (uncountable) = work background."],
    ["The warehouse is open Monday ___ Saturday.", ["through", "between", "among", "since"], "'Monday through Saturday' = from Monday to Saturday."]
  ];

  // [sentence with ___, [correct, wrong, wrong, wrong], why]
  var VOCAB = [
    ["Please ___ the meeting to next Tuesday; the director is traveling.", ["postpone", "cancel", "attend", "prepare"], "'Postpone … to' = move to a later date."],
    ["The company will ___ two new engineers next month.", ["hire", "retire", "resign", "dismiss"], "'Hire' = give someone a job."],
    ["Our ___ for this project is $50,000.", ["budget", "salary", "agenda", "receipt"], "'Budget' = money planned for a project."],
    ["The client signed the ___ after reviewing the terms.", ["contract", "résumé", "schedule", "brochure"], "A contract has terms and is signed."],
    ["Please send me an ___ of the costs before we start.", ["estimate", "attendance", "applause", "appointment"], "'Estimate' = approximate calculation of costs."],
    ["New employees must ___ a three-day orientation.", ["attend", "afford", "admit", "adopt"], "'Attend' = be present at an event."],
    ["The ___ for applications is March 15.", ["deadline", "headline", "lifeline", "guideline"], "'Deadline' = the last date allowed."],
    ["Sales have ___ steadily since we launched the website.", ["increased", "raised", "lifted", "advised"], "'Increase' works without an object; 'raise' needs one."],
    ["Please ___ your expense reports to the finance department.", ["submit", "admit", "commit", "permit"], "'Submit' = hand in."],
    ["The ___ includes breakfast and free Wi-Fi.", ["reservation", "receptionist", "refund", "resignation"], "A hotel reservation can include breakfast."],
    ["The factory had to ___ production because of a power outage.", ["suspend", "suspect", "sustain", "suggest"], "'Suspend' = stop temporarily."],
    ["Our team ___ the sales target by 20 percent.", ["exceeded", "excluded", "excused", "exchanged"], "'Exceed' = go beyond."],
    ["We received many ___ from customers about the late deliveries.", ["complaints", "compliments", "components", "complements"], "Late deliveries cause complaints."],
    ["The manager will ___ the tasks among the team members.", ["distribute", "contribute", "attribute", "constitute"], "'Distribute among' = share out."],
    ["Please keep this information ___; do not share it outside the company.", ["confidential", "confident", "considerable", "conditional"], "'Confidential' = private, secret."],
    ["The ___ of the new branch is scheduled for May 1.", ["opening", "open", "opener", "opened"], "A noun after 'the': the opening (event)."],
    ["We need to ___ the printer cartridge; it's empty.", ["replace", "repair", "refuse", "reply"], "An empty cartridge is replaced, not repaired."],
    ["Our office will ___ to a larger building next year.", ["relocate", "relate", "release", "rely"], "'Relocate' = move to a new place."],
    ["The training session was very ___; I learned a lot.", ["informative", "informal", "informed", "information"], "'Informative' = gives useful information."],
    ["Please ___ receipt of this email by replying today.", ["confirm", "conform", "confine", "confess"], "'Confirm receipt' = say you received it."],
    ["The company offers a generous ___ package, including health insurance.", ["benefits", "beneficial", "beneficiary", "benefited"], "'Benefits package' = insurance, vacation, etc."],
    ["The ___ was delayed because the truck broke down.", ["delivery", "deliver", "delivered", "deliverer"], "A noun after 'the': the delivery."],
    ["We must ___ with safety regulations at all times.", ["comply", "complete", "compile", "compare"], "'Comply with' = follow rules."],
    ["The CEO will ___ the new strategy at the annual meeting.", ["announce", "pronounce", "denounce", "renounce"], "'Announce' = tell publicly."],
    ["Customers can ___ a refund within 30 days.", ["request", "require", "respond", "reserve"], "'Request a refund' = ask for money back."],
    ["The marketing ___ was a big success; sales doubled.", ["campaign", "complaint", "compartment", "component"], "'Marketing campaign' = planned promotion."],
    ["Please make an ___ with the dentist for next week.", ["appointment", "agreement", "announcement", "attachment"], "'Make an appointment' = schedule a visit."],
    ["The ___ shows that profits rose in the third quarter.", ["report", "reporter", "reporting", "reportedly"], "A report shows results."],
    ["The meeting room can ___ up to 20 people.", ["accommodate", "accompany", "accumulate", "accuse"], "'Accommodate' = have space for."],
    ["The new manager is very ___; she always answers emails quickly.", ["responsive", "resistant", "restless", "reluctant"], "'Responsive' = reacts quickly."],
    ["Our ___ hours are 8 a.m. to 5 p.m., Monday to Friday.", ["business", "busy", "busily", "businesses"], "'Business hours' = opening hours."],
    ["The project was ___ due to a lack of funding.", ["canceled", "celebrated", "calculated", "captured"], "No money → the project was canceled."],
    ["Please read the ___ before installing the software.", ["instructions", "institutions", "inspections", "intentions"], "'Instructions' = steps to follow."],
    ["Employees are ___ to a 30-minute lunch break.", ["entitled", "entertained", "entered", "enclosed"], "'Entitled to' = have the right to."],
    ["The hotel staff were very ___ and helpful.", ["courteous", "curious", "cautious", "conscious"], "'Courteous' = polite."],
    ["The company ___ its products in more than 40 countries.", ["sells", "buys", "spends", "lends"], "A company sells its own products."]
  ];

  // Part 7: passage + 3 questions [question, [correct, wrong, wrong, wrong], why]
  var R7 = [
    { title: 'Email', text: "To: All Staff\nFrom: Linda Park, Facilities Manager\nSubject: Elevator maintenance\n\nPlease note that the east elevator will be closed for maintenance from Monday, June 3, to Wednesday, June 5. During this time, employees on floors 6 to 10 should use the west elevator or the stairs. Deliveries will be received at the loading dock instead of the main entrance. We apologize for any inconvenience. If you have questions, contact me at extension 214.",
      qs: [
        ["What is the purpose of the email?", ["To announce a temporary closure", "To introduce a new manager", "To request more deliveries", "To change office hours"], "The email announces that the east elevator will be closed for a few days."],
        ["How long will the east elevator be closed?", ["Three days", "One day", "Two days", "One week"], "Monday, Tuesday and Wednesday = three days."],
        ["Where will deliveries be received?", ["At the loading dock", "At the main entrance", "On the sixth floor", "At extension 214"], "'Deliveries will be received at the loading dock instead of the main entrance.'"]
      ] },
    { title: 'Advertisement', text: "Greenline Office Supplies — Summer Sale!\nSave 20% on all printer paper and ink from July 1 to July 15. Orders over $100 receive free next-day delivery within the city. Business customers who open an account this month will also get a free desk organizer. Visit our store at 45 Harbor Road or order online at greenline.com.",
      qs: [
        ["What is being advertised?", ["A sale on office supplies", "A new printer model", "A delivery job", "A business course"], "The ad is about a summer sale on paper and ink."],
        ["What do customers get with orders over $100?", ["Free next-day delivery", "An extra 20% discount", "A free desk organizer", "A store account"], "'Orders over $100 receive free next-day delivery.'"],
        ["Who can receive a free desk organizer?", ["Business customers who open an account this month", "All online customers", "Customers who spend over $100", "Customers who visit on July 1"], "Only business customers who open an account this month get it."]
      ] },
    { title: 'Notice', text: "Notice to Tenants\nBeginning August 1, the parking garage will require an electronic access card. Cards can be picked up at the building management office on the first floor, Monday to Friday, 9 a.m. to 4 p.m. Each tenant company may request up to five cards at no charge. Additional cards cost $15 each. Paper parking permits will no longer be accepted after July 31.",
      qs: [
        ["What will change on August 1?", ["An access card will be required", "The garage will close", "Parking fees will increase", "The management office will move"], "From August 1 the garage requires an electronic access card."],
        ["How much do the first five cards cost?", ["Nothing", "$5 each", "$15 each", "$75 in total"], "'Up to five cards at no charge' = free."],
        ["What is true about paper permits?", ["They will be accepted until July 31", "They can be exchanged for cash", "They are sold on the first floor", "They cost $15"], "They will no longer be accepted after July 31."]
      ] },
    { title: 'Article', text: "Riverside Hotel Expands\nThe Riverside Hotel announced yesterday that it will add a new wing with 80 guest rooms and a conference center. Construction will begin in September and is expected to take 14 months. General manager Paul Ortiz said the expansion is a response to growing demand from business travelers. The hotel will remain open during construction, although the outdoor pool will be closed.",
      qs: [
        ["What is the article mainly about?", ["A hotel's expansion plans", "A new general manager", "A travel agency", "A swimming competition"], "The article describes the new wing and conference center."],
        ["Why is the hotel expanding?", ["Because of demand from business travelers", "To replace old rooms", "Because the pool is closed", "To host a sports event"], "Mr. Ortiz says it responds to growing demand from business travelers."],
        ["What will happen during construction?", ["The outdoor pool will be unavailable", "The hotel will close", "Guests will get discounts", "The conference center will open"], "'The hotel will remain open … although the outdoor pool will be closed.'"]
      ] },
    { title: 'Memo', text: "MEMO\nTo: Sales Team\nFrom: Daniel Brooks\nRe: Quarterly results\n\nGreat work this quarter! Our team reached 112% of its sales target, mainly thanks to strong growth in online orders. To celebrate, we will have a team lunch on Friday at 12:30 at Bella Cucina. Please confirm your attendance with Maria by Wednesday so she can make the reservation. Next quarter, our focus will be on expanding sales to small businesses.",
      qs: [
        ["Why is Mr. Brooks writing?", ["To congratulate the team and invite them to lunch", "To announce a lower target", "To hire a new salesperson", "To complain about online orders"], "He praises the results and announces a celebration lunch."],
        ["What should employees do by Wednesday?", ["Confirm their attendance with Maria", "Make a restaurant reservation", "Submit a sales report", "Contact small businesses"], "'Please confirm your attendance with Maria by Wednesday.'"],
        ["What will the team focus on next quarter?", ["Sales to small businesses", "Online orders", "Restaurant clients", "Reducing costs"], "'Our focus will be on expanding sales to small businesses.'"]
      ] },
    { title: 'Job posting', text: "Customer Service Representative — Bayview Electronics\nWe are looking for a full-time representative to answer customer calls and emails. Requirements: at least one year of customer service experience, excellent communication skills in English and Spanish, and basic computer skills. The position offers health insurance and two weeks of paid vacation. Send your résumé to jobs@bayview.com by May 20. Interviews will be held the following week.",
      qs: [
        ["What is one requirement for the job?", ["Communication skills in English and Spanish", "A university degree", "Experience in sales", "Five years of experience"], "The posting lists excellent English and Spanish communication skills."],
        ["What benefit is mentioned?", ["Health insurance", "A company car", "Free electronics", "Flexible hours"], "'The position offers health insurance and two weeks of paid vacation.'"],
        ["When will interviews take place?", ["The week after May 20", "Before May 20", "On May 20", "In July"], "Résumés are due May 20; interviews are 'the following week'."]
      ] },
    { title: 'Email', text: "Dear Mr. Alvarez,\nThank you for registering for the Digital Marketing Workshop. Due to high demand, we have moved the event from Room 3B to the Main Auditorium. The date, Thursday, October 10, has not changed, but the start time is now 9:30 a.m. instead of 9:00 a.m. Lunch will be provided. Please bring your registration confirmation to the check-in desk.\nBest regards,\nEvent Team",
      qs: [
        ["What has changed about the workshop?", ["The location and start time", "The date", "The price", "The speaker"], "The room moved and the start time changed; the date did not."],
        ["What time will the workshop begin?", ["9:30 a.m.", "9:00 a.m.", "10:00 a.m.", "10:30 a.m."], "'The start time is now 9:30 a.m.'"],
        ["What should Mr. Alvarez bring?", ["His registration confirmation", "His own lunch", "A laptop", "A business card"], "'Please bring your registration confirmation to the check-in desk.' Lunch is provided."]
      ] },
    { title: 'Company policy', text: "Travel Expense Policy\nEmployees traveling for business must submit receipts for all expenses within 10 days of returning. Meals are covered up to $50 per day. Taxi fares are reimbursed only when public transportation is not available. Hotel bookings must be made through the company's travel agency. Expenses submitted after the 10-day period will require approval from a department manager.",
      qs: [
        ["Within how many days must receipts be submitted?", ["10", "5", "15", "50"], "'Within 10 days of returning.'"],
        ["When are taxi fares reimbursed?", ["When public transportation is not available", "Always", "Only for managers", "When the trip is longer than 10 days"], "'Only when public transportation is not available.'"],
        ["What happens if expenses are submitted late?", ["They need a manager's approval", "They are never paid", "They are paid at 50%", "They must go through the travel agency"], "Late expenses 'will require approval from a department manager.'"]
      ] },
    { title: 'Online review', text: "I stayed at the Lakeside Inn for three nights during a business trip. The room was clean and quiet, and the staff at the front desk were very helpful. However, the Wi-Fi was slow, which made it difficult to join video meetings. Breakfast was included and had many healthy options. I would stay here again, but I hope they improve the internet connection.\n— Rachel Kim",
      qs: [
        ["Why did Ms. Kim stay at the Lakeside Inn?", ["For a business trip", "For a vacation", "For a wedding", "For a conference she organized"], "'During a business trip.'"],
        ["What problem did she mention?", ["The Wi-Fi was slow", "The room was noisy", "The staff were unhelpful", "Breakfast was expensive"], "'The Wi-Fi was slow, which made it difficult to join video meetings.'"],
        ["What is suggested about Ms. Kim?", ["She would stay there again", "She will never return", "She works at the inn", "She paid extra for breakfast"], "'I would stay here again.' Breakfast was included."]
      ] },
    { title: 'Notice', text: "Harbor Co-Working Space — New Hours\nStarting November 1, we will be open from 7 a.m. to 10 p.m. on weekdays, two hours later than before. Weekend hours will stay the same: 9 a.m. to 5 p.m. Members can now reserve meeting rooms through our mobile app instead of calling the front desk. Each member receives four free hours of meeting room use per month.",
      qs: [
        ["What change will happen on November 1?", ["Weekday hours will be extended", "Weekend hours will change", "The space will close", "Prices will increase"], "It will stay open two hours later on weekdays."],
        ["How can members reserve meeting rooms now?", ["Through the mobile app", "By calling the front desk", "By email", "In person only"], "'Through our mobile app instead of calling the front desk.'"],
        ["How many free meeting room hours do members get each month?", ["Four", "Two", "Seven", "Ten"], "'Four free hours of meeting room use per month.'"]
      ] }
  ];

  var PARTS = {
    l2: { label: 'Listening Part 2 — Question-Response', short: 'Listening Part 2', size: 25, listening: true },
    r5: { label: 'Reading Part 5 — Incomplete Sentences', short: 'Reading Part 5', size: 25 },
    vocab: { label: 'Vocabulary — Workplace English', short: 'Vocabulary', size: 25 },
    r7: { label: 'Reading Part 7 — Reading Comprehension', short: 'Reading Part 7', passages: 7 }
  };

  function bank(part) {
    var out = [];
    if (part === 'l2') L2.forEach(function (x, i) { out.push({ id: 'l2-' + (i + 1), q: x[0], opts: x[1], why: x[2] }); });
    if (part === 'r5') R5.forEach(function (x, i) { out.push({ id: 'r5-' + (i + 1), q: x[0], opts: x[1], why: x[2] }); });
    if (part === 'vocab') VOCAB.forEach(function (x, i) { out.push({ id: 'vo-' + (i + 1), q: x[0], opts: x[1], why: x[2] }); });
    if (part === 'r7') R7.forEach(function (p, pi) {
      p.qs.forEach(function (x, qi) { out.push({ id: 'r7-' + (pi + 1) + '-' + (qi + 1), group: 'r7-' + (pi + 1), passageTitle: p.title, passage: p.text, q: x[0], opts: x[1], why: x[2] }); });
    });
    return out;
  }

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function pickItems(part, sid) {
    var cfg = PARTS[part];
    var all = bank(part);
    var seenKey = 'claire_sets_seen:' + (sid || 'anon') + ':' + part;
    var seen = lsGet(seenKey, []);
    var picked;
    if (part === 'r7') {
      var groups = [];
      all.forEach(function (it) { if (groups.indexOf(it.group) < 0) groups.push(it.group); });
      var fresh = shuffle(groups.filter(function (g) { return seen.indexOf(g) < 0; }));
      var old = shuffle(groups.filter(function (g) { return seen.indexOf(g) >= 0; }));
      var chosen = fresh.concat(old).slice(0, cfg.passages);
      seen = fresh.length >= cfg.passages ? seen.concat(chosen) : chosen.slice();
      lsSet(seenKey, seen);
      picked = [];
      chosen.forEach(function (g) { all.forEach(function (it) { if (it.group === g) picked.push(it); }); });
    } else {
      var freshI = shuffle(all.filter(function (it) { return seen.indexOf(it.id) < 0; }));
      var oldI = shuffle(all.filter(function (it) { return seen.indexOf(it.id) >= 0; }));
      picked = freshI.concat(oldI).slice(0, cfg.size);
      var ids = picked.map(function (it) { return it.id; });
      seen = freshI.length >= cfg.size ? seen.concat(ids) : ids;
      lsSet(seenKey, seen);
    }
    return picked.map(function (it) {
      var opts = shuffle(it.opts.map(function (t, i) { return { text: t, correct: i === 0 }; }));
      return { id: it.id, q: it.q, why: it.why, passage: it.passage || '', passageTitle: it.passageTitle || '', group: it.group || '', opts: opts };
    });
  }

  var LETTERS = ['A', 'B', 'C', 'D'];
  var S = null; // active session state
  var hooks = {};

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  function correctIndex(item) { for (var i = 0; i < item.opts.length; i++) if (item.opts[i].correct) return i; return -1; }

  function listeningScript(item, n) {
    var s = 'Number ' + n + '. ' + item.q;
    item.opts.forEach(function (o, i) { s += '\n' + LETTERS[i] + '. ' + o.text; });
    return s;
  }

  function speakCurrent() {
    if (!S || !PARTS[S.part].listening || !hooks.speak) return;
    var item = S.items[S.i];
    try { hooks.speak(listeningScript(item, S.i + 1)); } catch (e) {}
  }

  function start(part, opts) {
    if (!PARTS[part]) return false;
    hooks = opts || {};
    S = { part: part, items: pickItems(part, hooks.studentId), i: 0, answers: [], done: false, showText: false, spoken: -1, reviewOnly: false };
    return true;
  }

  function startReview() {
    if (!S) return;
    var wrong = [];
    S.items.forEach(function (it, idx) { var a = S.answers[idx]; if (a && !a.ok) wrong.push(it); });
    if (!wrong.length) return;
    S = { part: S.part, items: wrong.map(function (it) { return { id: it.id, q: it.q, why: it.why, passage: it.passage, passageTitle: it.passageTitle, group: it.group, opts: shuffle(it.opts) }; }), i: 0, answers: [], done: false, showText: false, spoken: -1, reviewOnly: true };
  }

  function stop() {
    if (hooks.stopSpeech) { try { hooks.stopSpeech(); } catch (e) {} }
    S = null;
  }

  function score() {
    var ok = 0;
    S.answers.forEach(function (a) { if (a && a.ok) ok++; });
    return ok;
  }

  function saveResult() {
    if (!S || S.reviewOnly) return;
    var key = 'claire_sets_results:' + (hooks.studentId || 'anon');
    var list = lsGet(key, []);
    list.push({ part: S.part, score: score(), total: S.items.length, at: new Date().toISOString() });
    lsSet(key, list.slice(-50));
    if (hooks.onResult) { try { hooks.onResult({ part: S.part, score: score(), total: S.items.length }); } catch (e) {} }
  }

  var BTN = 'display:block;width:100%;text-align:left;background:rgba(255,255,255,0.07);border:1.5px solid rgba(192,132,252,0.35);color:#fff;border-radius:12px;padding:12px 14px;margin-bottom:8px;font-size:14px;line-height:1.45;cursor:pointer;';
  var BTN_MAIN = 'display:inline-flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,#2B7EC1,#1F6AA8);border:none;color:#fff;font-weight:800;font-size:14px;padding:12px 18px;border-radius:12px;cursor:pointer;';
  var BTN_GHOST = 'display:inline-flex;align-items:center;justify-content:center;gap:6px;background:rgba(255,255,255,0.08);border:1px solid rgba(192,132,252,0.4);color:#e9d5ff;font-weight:700;font-size:13px;padding:10px 14px;border-radius:12px;cursor:pointer;';

  function renderItem() {
    var cfg = PARTS[S.part];
    var item = S.items[S.i];
    var n = S.i + 1, total = S.items.length;
    var ans = S.answers[S.i];
    var answered = !!ans;
    var pct = Math.round((S.i / total) * 100);
    var h = '';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">'
      + '<div style="font-size:12px;font-weight:800;color:#79B9E8;letter-spacing:.04em;">' + esc(cfg.label) + (S.reviewOnly ? ' · Review' : '') + '</div>'
      + '<div style="font-size:12px;color:#e9d5ff;font-weight:700;">Question ' + n + ' of ' + total + ' · Score ' + score() + '/' + S.answers.filter(Boolean).length + '</div></div>';
    h += '<div style="height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin-bottom:14px;"><i style="display:block;height:100%;width:' + pct + '%;background:#79B9E8;"></i></div>';

    if (item.passage) {
      h += '<div style="background:#fff;color:#15232C;border-radius:12px;padding:14px 16px;margin-bottom:12px;font-size:14px;line-height:1.6;white-space:pre-wrap;max-height:300px;overflow:auto;">'
        + '<div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#56676E;margin-bottom:6px;">' + esc(item.passageTitle) + '</div>' + esc(item.passage) + '</div>';
    }

    if (cfg.listening) {
      var showText = answered || S.showText;
      h += '<div style="background:rgba(255,255,255,0.06);border:1px solid rgba(192,132,252,0.3);border-radius:12px;padding:12px 14px;margin-bottom:12px;">'
        + '<div style="font-size:13px;color:#e9d5ff;margin-bottom:8px;">🎧 Listen to the question and the three responses. Choose the best response.</div>'
        + '<div style="display:flex;gap:8px;flex-wrap:wrap;">'
        + '<button type="button" data-cs="replay" style="' + BTN_GHOST + '"><i class="ti ti-volume"></i> Play again</button>'
        + (answered ? '' : '<button type="button" data-cs="text" style="' + BTN_GHOST + '"><i class="ti ti-eye"></i> ' + (S.showText ? 'Hide text' : 'Show text') + '</button>')
        + '</div>'
        + (showText ? '<div style="margin-top:10px;font-size:15px;font-weight:700;color:#fff;">“' + esc(item.q) + '”</div>' : '')
        + '</div>';
    } else {
      h += '<div style="font-size:16px;font-weight:700;line-height:1.5;color:#fff;margin-bottom:12px;">' + esc(item.q).replace(/___/g, '<span style="display:inline-block;min-width:70px;border-bottom:2px solid #79B9E8;"></span>') + '</div>';
    }

    var ci = correctIndex(item);
    item.opts.forEach(function (o, i) {
      var style = BTN;
      var mark = '';
      if (answered) {
        if (i === ci) { style += 'background:rgba(34,197,94,0.22);border-color:#22c55e;'; mark = ' ✓'; }
        else if (i === ans.chosen) { style += 'background:rgba(239,68,68,0.22);border-color:#ef4444;'; mark = ' ✗'; }
        else style += 'opacity:.6;';
        style += 'cursor:default;';
      }
      var label = (cfg.listening && !answered && !S.showText) ? '' : ' ' + esc(o.text);
      h += '<button type="button" class="claire-toeic-opt" data-cs="ans" data-i="' + i + '"' + (answered ? ' disabled' : '') + ' style="' + style + '"><strong>' + LETTERS[i] + '.</strong>' + label + mark + '</button>';
    });

    if (answered) {
      h += '<div role="status" style="margin-top:6px;border-radius:12px;padding:12px 14px;font-size:14px;line-height:1.55;'
        + (ans.ok ? 'background:rgba(34,197,94,0.14);border:1px solid rgba(34,197,94,0.5);' : 'background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.5);') + '">'
        + '<strong>' + (ans.ok ? 'Correct!' : 'Not quite. The correct answer is ' + LETTERS[ci] + ': ' + esc(item.opts[ci].text)) + '</strong><br>'
        + esc(item.why) + '</div>';
      h += '<div style="margin-top:12px;display:flex;justify-content:flex-end;">'
        + '<button type="button" data-cs="next" style="' + BTN_MAIN + '">' + (S.i + 1 < total ? 'Next question <i class="ti ti-arrow-right"></i>' : 'See my results <i class="ti ti-flag"></i>') + '</button></div>';
    }
    h += '<div style="margin-top:14px;display:flex;justify-content:flex-start;"><button type="button" data-cs="exit" style="' + BTN_GHOST + '"><i class="ti ti-x"></i> Exit practice</button></div>';
    return h;
  }

  function renderSummary() {
    var cfg = PARTS[S.part];
    var ok = score(), total = S.items.length;
    var pct = total ? Math.round((ok / total) * 100) : 0;
    var msg = pct >= 85 ? 'Excellent work — test-ready level for this part.' : pct >= 70 ? 'Good result. Review the mistakes below and try a new set.' : pct >= 50 ? 'You are improving. Study the explanations and practice again.' : 'Keep practicing — read each explanation carefully and try again.';
    var h = '<div style="text-align:center;margin-bottom:14px;">'
      + '<div style="font-size:12px;font-weight:800;color:#79B9E8;letter-spacing:.04em;">' + esc(cfg.label) + (S.reviewOnly ? ' · Review' : '') + '</div>'
      + '<div style="font-size:44px;font-weight:900;color:#fff;margin:6px 0 0;">' + ok + ' / ' + total + '</div>'
      + '<div style="font-size:15px;font-weight:800;color:#e9d5ff;">' + pct + '%</div>'
      + '<div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:6px;">' + esc(msg) + '</div></div>';
    var wrong = [];
    S.items.forEach(function (it, idx) { var a = S.answers[idx]; if (a && !a.ok) wrong.push({ it: it, a: a, n: idx + 1 }); });
    if (wrong.length) {
      h += '<div style="font-size:13px;font-weight:800;color:#fff;margin:6px 0 8px;">Review your mistakes (' + wrong.length + ')</div>';
      wrong.forEach(function (w) {
        var ci = correctIndex(w.it);
        h += '<div style="background:rgba(255,255,255,0.06);border:1px solid rgba(239,68,68,0.35);border-radius:12px;padding:10px 12px;margin-bottom:8px;font-size:13px;line-height:1.5;color:#fff;">'
          + '<div style="font-weight:700;">' + w.n + '. ' + esc(w.it.q) + '</div>'
          + '<div style="color:#fca5a5;">Your answer: ' + esc(w.it.opts[w.a.chosen].text) + '</div>'
          + '<div style="color:#86efac;">Correct: ' + esc(w.it.opts[ci].text) + '</div>'
          + '<div style="color:rgba(255,255,255,0.8);">' + esc(w.it.why) + '</div></div>';
      });
    }
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">'
      + '<button type="button" data-cs="new" style="' + BTN_MAIN + 'flex:1;"><i class="ti ti-refresh"></i> New set (new questions)</button>'
      + (wrong.length ? '<button type="button" data-cs="review" style="' + BTN_GHOST + 'flex:1;"><i class="ti ti-repeat"></i> Practice my mistakes</button>' : '')
      + '<button type="button" data-cs="exit" style="' + BTN_GHOST + 'flex:1;"><i class="ti ti-arrow-left"></i> Back to Claire</button></div>';
    return h;
  }

  function render(container) {
    if (!container || !S) return;
    container.innerHTML = S.done ? renderSummary() : renderItem();
    container.onclick = function (ev) {
      var el = ev.target;
      while (el && el !== container && !el.getAttribute('data-cs')) el = el.parentNode;
      if (!el || el === container || !S) return;
      var act = el.getAttribute('data-cs');
      if (act === 'ans') {
        if (S.answers[S.i]) return;
        var i = parseInt(el.getAttribute('data-i'), 10);
        var item = S.items[S.i];
        S.answers[S.i] = { chosen: i, ok: !!(item.opts[i] && item.opts[i].correct) };
        if (hooks.stopSpeech) { try { hooks.stopSpeech(); } catch (e) {} }
      } else if (act === 'next') {
        if (S.i + 1 < S.items.length) { S.i++; S.showText = false; }
        else { S.done = true; saveResult(); }
      } else if (act === 'replay') {
        speakCurrent();
        return;
      } else if (act === 'text') {
        S.showText = !S.showText;
      } else if (act === 'new') {
        start(S.part, hooks);
      } else if (act === 'review') {
        startReview();
      } else if (act === 'exit') {
        stop();
        if (hooks.onExit) hooks.onExit();
        return;
      }
      render(container);
    };
    if (!S.done && PARTS[S.part].listening && S.spoken !== S.i) {
      S.spoken = S.i;
      speakCurrent();
    }
  }

  global.ClaireSets = {
    PARTS: PARTS,
    start: start,
    stop: stop,
    render: render,
    isActive: function () { return !!S; },
    part: function () { return S ? S.part : null; },
    _bank: bank
  };
})(typeof window !== 'undefined' ? window : this);
