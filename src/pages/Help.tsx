import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, ChevronLeft, ChevronRight, CheckCircle2, BookOpen, Target, Shield, ArrowLeft } from 'lucide-react';

type Chapter = {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  roles: string[];
  content: string;
};

const CHAPTERS: Chapter[] = [
  // ================= LEVEL 1 =================
  {
    id: 'ch1', title: 'Chapter 1 — Welcome to BXB', level: 1, roles: ['all'],
    content: `
      <h3>1.1 Welcome to the BXB network</h3>
      <p>Welcome to BXB!</p>
      <p>BXB is an international freelance technology network led by its founder, Elyes Kallel.</p>
      <p>BXB works with independent sales teams and technical collaborators in different countries.</p>
      <p>Our network helps businesses improve their work through technology.</p>
      <p>Some of the services we provide include: Artificial Intelligence solutions, Business automation, Software development, Websites, Web applications, API integrations, Business management systems, and Digital solutions.</p>
      <p>You do not need to be a programmer to work with BXB as a sales representative.</p>
      <p>Your main job is to find businesses that may need our services and connect them with BXB.</p>
      <p>The technical side handles the assessment and production work.</p>
      <p>Your job is to help bring good business opportunities to the network.</p>

      <h3>1.2 Why do we use this application?</h3>
      <p>The BXB application is the main workspace for our network. It helps us organize our work in one place.</p>
      <p>You can use it to: Find and manage your prospects, Record calls and messages, Remember important follow-ups, Schedule meetings, Track your opportunities, Submit technical requests, Read company announcements, Access sales materials, Complete training, and See your performance.</p>
      <p>The application helps you remember what happened, what you need to do next and which opportunities need your attention.</p>
      <p><strong>Important:</strong> Use the application to record your real work. Do not create fake activities or fake business opportunities just to increase your numbers.</p>

      <h3>1.3 The two main parts of BXB</h3>
      <p>BXB has two main working areas: <strong>Sales and Business Development</strong>, and <strong>Technical Production</strong>.</p>
      <p>Both sides work together. You do not have to understand how every technical solution is built. You only need to understand what the service does and when a business may need it.</p>
    `
  },
  {
    id: 'ch2', title: 'Chapter 2 — Getting Started', level: 1, roles: ['all'],
    content: `
      <h3>2.1 Your BXB account</h3>
      <p>Before using the application, your team administrator will provide you with a User ID. Your User ID may look like: SALES-0001, SALES-0002, DEV-0001. Keep it safe. Do not share your password with anybody.</p>

      <h3>2.2 Creating your account for the first time</h3>
      <p>Follow these steps:</p>
      <ul>
        <li><strong>Step 1:</strong> Open the BXB application using the link provided by your team.</li>
        <li><strong>Step 2:</strong> Find the account claiming or registration section.</li>
        <li><strong>Step 3:</strong> Enter the User ID given to you by the administrator.</li>
        <li><strong>Step 4:</strong> Create your password.</li>
        <li><strong>Step 5:</strong> Complete the information requested by the application.</li>
        <li><strong>Step 6:</strong> Upload a profile picture if the application asks for one or allows it.</li>
        <li><strong>Step 7:</strong> Complete your account setup.</li>
      </ul>
      <p>The BXB login system uses your User ID and password. You do not need to enter a normal email address to log in.</p>

      <h3>2.3 Logging in again</h3>
      <p>Open the application, enter your User ID, enter your password, and press the login button. You should arrive at your personal dashboard.</p>

      <h3>2.4 Choosing a password</h3>
      <p>Use a password that is difficult to guess. Do not use: Your name alone, Your User ID, Your birthday, 123456, or the same password you use everywhere. Never send your password to another representative or team leader.</p>

      <h3>2.5 Installing BXB on your phone</h3>
      <p>BXB is designed as a Progressive Web Application. This means that your phone may allow you to add it to your home screen. Look for the install option or the browser's add-to-home-screen option and follow the instructions.</p>

      <h3>2.6 Your first login</h3>
      <p>Check: Your name, Your profile picture, Your team, Your country, Your available menu items, Your notifications, Your resources, and Your dashboard. Do not worry about understanding everything immediately.</p>
    `
  },
  {
    id: 'ch3', title: 'Chapter 3 — Understanding the Application', level: 1, roles: ['all'],
    content: `
      <h3>3.1 Your main navigation</h3>
      <p>On a phone, the main navigation is designed to keep the most important pages easy to reach. The main sections are: Home, Leads, Pipeline, Tasks, and More.</p>
      <p>The More section may include: Meetings, Technical Handovers, Deals, Proposals, Services, Reports, Resources, Updates, Training, Playbooks, Leaderboard, and Profile. The items you see depend on your role.</p>

      <h3>3.2 Desktop navigation</h3>
      <p>On a laptop, you may see a sidebar. Click a page name to open it. Some pages may only be available to team leaders or administrators.</p>

      <h3>3.3 The notification bell</h3>
      <p>The notification bell helps you see important updates. You may receive notifications about: New lead assignments, Changes to your opportunities, Upcoming meetings, Overdue tasks, Manager comments, Technical review updates, Proposal updates, and Important announcements.</p>
      <p>When you see an unread notification: Open the notification area, Read the message, Click it if it links to a business or task, and Complete the action if needed.</p>

      <h3>3.4 Your profile</h3>
      <p>Your profile contains your account information. Depending on your permissions, you may be able to change your profile picture, update your username, view your User ID, team information, and role information. Keep your profile information accurate.</p>
    `
  },
  {
    id: 'ch4', title: 'Chapter 4 — Your Home Dashboard', level: 1, roles: ['all'],
    content: `
      <h3>4.1 What is the dashboard?</h3>
      <p>The dashboard is the first page you should check when you start working. It gives you a quick view of your work, including: Today's tasks, Overdue tasks, Upcoming meetings, Overdue follow-ups, Active leads, Won deals, and Today's priorities.</p>

      <h3>4.2 How to use the dashboard</h3>
      <p>When you open BXB, follow this simple routine:</p>
      <ul>
        <li><strong>Step 1:</strong> Check your tasks. Look at the tasks you need to complete today.</li>
        <li><strong>Step 2:</strong> Check overdue work. Look for tasks or follow-ups that are late.</li>
        <li><strong>Step 3:</strong> Check meetings. See whether you have a meeting today or soon.</li>
        <li><strong>Step 4:</strong> Check your active leads. Look at the prospects you are currently working on.</li>
        <li><strong>Step 5:</strong> Check important notifications. Read messages from your team leader or BXB.</li>
        <li><strong>Step 6:</strong> Start working. Open your first task or lead.</li>
      </ul>

      <h3>4.3 What does an overdue task mean?</h3>
      <p>An overdue task is a task whose due date has passed and which is not completed. Do not ignore overdue tasks. Complete them or update the date when there is a valid reason.</p>

      <h3>4.4 What does an active lead mean?</h3>
      <p>An active lead is a potential client that is still being worked on. Always know the next step for your active leads.</p>
    `
  },
  {
    id: 'ch5', title: 'Chapter 5 — Understanding Leads', level: 1, roles: ['all'],
    content: `
      <h3>5.1 What is a lead?</h3>
      <p>A lead is a business that may become a BXB client. A lead does not mean that the business has agreed to buy anything. It only means that there may be a business opportunity.</p>

      <h3>5.2 What is a good lead?</h3>
      <p>A good lead should have: A real business, Correct business information, A possible need for BXB services, A way to contact the business through an appropriate channel, and A reasonable reason for contacting it.</p>
      <p>Focus on useful business opportunities, not just large numbers.</p>

      <h3>5.3 Opening your leads</h3>
      <p>Open the Leads section, look at your assigned leads, use search when you need to find a business, open a lead to see its details, review its current stage, review its activity history, and check its next follow-up.</p>

      <h3>5.4 Creating a new lead</h3>
      <p>Before creating a new lead, search for the business. This helps prevent duplicates.</p>
      <p>Open Leads, press New Lead, search for the business name. If a matching business appears, check whether it is already recorded. If it is genuinely a new business, complete the form and save the lead.</p>

      <h3>5.5 Entering correct information</h3>
      <p>Accuracy is very important. Do not invent a phone number. Do not guess an email address. Do not enter information that you have not checked. A lead with correct basic information is better than a lead full of guesses.</p>

      <h3>5.6 Duplicate leads</h3>
      <p>A duplicate means that the same business may already exist in BXB. The application may warn you that the business could already exist. Do not immediately create another record. Check the warning and follow the available review process. Do not try to take another representative's lead.</p>

      <h3>5.7 Lead ownership</h3>
      <p>Lead ownership means which representative is responsible for working on a lead. Work on your assigned leads. Do not change another person's ownership unless you have permission.</p>
    `
  },
  {
    id: 'ch7', title: 'Chapter 7 — Recording Your Activities', level: 1, roles: ['all'],
    content: `
      <h3>7.1 What is an activity?</h3>
      <p>An activity is something you did while working on a lead. Examples: You called a business, You sent an email, You sent a business message, You had a meeting, You spoke with a manager, You received a response, You made a follow-up.</p>

      <h3>7.2 Why is recording activities important?</h3>
      <p>Recording activities prevents confusion. Imagine you contact a business on Monday. On Wednesday, you speak to a different person from the same company. If you did not record Monday's conversation, you may forget what happened. Your team leader may also have no idea what you have already done.</p>

      <h3>7.3 Logging a phone call</h3>
      <p>Open Leads, select the correct business, find Activity or Log Activity, select Phone Call, select the correct outcome, write a short note, add the next action if needed, add a follow-up date if necessary, and save the activity.</p>
      <p><strong>Example:</strong> Activity type: Phone Call. Outcome: No Answer. Note: "Called the business. Nobody answered." Next action: "Try again during business hours." Follow-up date: Thursday.</p>

      <h3>7.4 Logging a successful conversation</h3>
      <p>Activity type: Phone Call. Outcome: Interested. Note: "Spoke with the manager. They are interested in learning about a new website and online customer system. They requested more information." Next action: "Send the approved BXB introduction and request a meeting."</p>

      <h3>7.5 Activity outcomes</h3>
      <p>Always select the outcome that really happened. Common outcomes: No Answer, Busy, Call Back Requested, Message Sent, Interested, Not Interested, Wrong Contact, Decision-Maker Identified, Meeting Requested, Meeting Confirmed, Needs More Information, Follow-up Required.</p>

      <h3>7.6 Adding notes</h3>
      <p>Write notes that another team member can understand.</p>
      <p><strong>Good note:</strong> "Spoke with the operations manager. They currently use a manual booking process. They asked us to explain possible automation options. Follow-up scheduled for Friday."</p>
      <p><strong>Bad note:</strong> "Good call."</p>
    `
  },
  {
    id: 'ch8', title: 'Chapter 8 — Tasks and Follow-ups', level: 1, roles: ['all'],
    content: `
      <h3>8.1 What is a task?</h3>
      <p>A task is something you need to do. For example: Call a prospect, Send a brochure, Follow up after a meeting, Ask the client for more information, Check a proposal, Contact a business again next week. A task helps you remember your work.</p>

      <h3>8.2 Creating a task</h3>
      <p>Open Tasks, press New Task, write a clear title, add a description if needed, select the priority, choose the due date, choose the time if available, link the task to the correct lead if possible, and save.</p>
      <p><strong>Good task titles:</strong> Call ABC Restaurant, Send approved BXB brochure, Follow up with operations manager, Confirm Thursday discovery meeting. Avoid unclear titles such as: Work, Important, Call, Tomorrow.</p>

      <h3>8.3 Understanding task priority</h3>
      <p>Use priorities honestly. Do not mark every task as urgent.</p>
      <ul>
        <li><strong>Urgent:</strong> Needs attention immediately or very soon.</li>
        <li><strong>High:</strong> Important and should be completed soon.</li>
        <li><strong>Medium:</strong> Normal daily work.</li>
        <li><strong>Low:</strong> Can be handled after more important tasks.</li>
      </ul>

      <h3>8.4 Completing a task</h3>
      <p>Open Tasks, find the correct task, read its title and details, perform the work, and mark it as completed. Only mark a task complete when you have actually finished it.</p>

      <h3>8.5 Rescheduling a task</h3>
      <p>Sometimes something happens and you cannot complete a task. Do not simply ignore it. Open the task and change its due date when the application allows it. Make sure the new date is realistic.</p>

      <h3>8.6 Daily follow-up rule</h3>
      <p>Every active business opportunity should have a clear next action whenever practical. This makes your work easier and helps your team understand what is happening.</p>
    `
  },
  {
    id: 'ch22', title: 'Chapter 22 — Your Daily Work Routine', level: 1, roles: ['all'],
    content: `
      <h3>When you start working</h3>
      <ul>
        <li>Open BXB.</li>
        <li>Check your dashboard.</li>
        <li>Read important notifications.</li>
        <li>Check today's tasks.</li>
        <li>Check overdue follow-ups.</li>
        <li>Check your meetings.</li>
      </ul>
      <h3>During your working time</h3>
      <ul>
        <li>Open your assigned leads.</li>
        <li>Research the businesses.</li>
        <li>Contact suitable prospects.</li>
        <li>Record every important interaction.</li>
        <li>Update lead information.</li>
        <li>Create follow-up tasks.</li>
        <li>Arrange meetings when appropriate.</li>
        <li>Submit qualified opportunities for review.</li>
        <li>Follow up with businesses at the agreed time.</li>
      </ul>
      <h3>Before finishing</h3>
      <ul>
        <li>Review your activities.</li>
        <li>Complete finished tasks.</li>
        <li>Update unfinished tasks.</li>
        <li>Check upcoming meetings.</li>
        <li>Make sure important leads have a next action.</li>
        <li>Read any important team updates.</li>
      </ul>
      <p><strong>Your most important daily habit:</strong> Never finish working on a serious opportunity without knowing what should happen next.</p>
    `
  },

  // ================= LEVEL 2 =================
  {
    id: 'ch6', title: 'Chapter 6 — Understanding the Sales Pipeline', level: 2, roles: ['all'],
    content: `
      <h3>6.1 What is the pipeline?</h3>
      <p>The pipeline shows how far each business has moved in the sales process. Think of it as a journey. A business starts as a new prospect. You contact it. You learn about its needs. You arrange a meeting. You understand the project. BXB assesses the solution. A proposal may be sent. The opportunity may become a client.</p>

      <h3>6.2 Understanding the pipeline stages</h3>
      <p><strong>1. New Lead:</strong> A business has just been added. Check its information and prepare your first contact.</p>
      <p><strong>2. Researching:</strong> You are checking the business and learning more about it. Find correct business information and understand what it does.</p>
      <p><strong>3. Ready to Contact:</strong> The lead has enough information for you to begin contacting it. Prepare your introduction and contact the business.</p>
      <p><strong>4. Contact Attempted:</strong> You tried to contact the business. Record the attempt and plan the next suitable action.</p>
      <p><strong>5. Contacted:</strong> You successfully reached somebody at the business. Record what happened and identify the next step.</p>
      <p><strong>6. Response Received:</strong> The business has replied to you. Read the response, understand the interest and arrange the next action.</p>
      <p><strong>7. Qualified:</strong> The business has passed the qualification review. Continue toward a discovery meeting or the next approved step.</p>
      <p><strong>8. Meeting Proposed:</strong> You have suggested a meeting. Wait for confirmation and follow up appropriately.</p>
      <p><strong>9. Meeting Scheduled:</strong> A meeting has been arranged. Prepare for the meeting.</p>
      <p><strong>10. Discovery Completed:</strong> The discovery discussion has taken place. Record the meeting outcome and submit the necessary technical information.</p>
      <p><strong>11. Technical Review:</strong> The BXB technical side is checking the requirements. Wait for feedback.</p>
      <p><strong>12. Proposal Preparation:</strong> The proposed solution and commercial details are being prepared.</p>
      <p><strong>13. Proposal Sent:</strong> An approved proposal has been sent to the client. Record the follow-up.</p>
      <p><strong>14. Negotiation:</strong> The client is discussing the proposal or asking for changes.</p>
      <p><strong>15. Won:</strong> The opportunity has been confirmed as successful according to the approved BXB process.</p>
      <p><strong>16. Lost:</strong> The opportunity has ended without a successful deal. Record the reason accurately.</p>
      <p><strong>17. Nurture:</strong> The business may be interested later, but it is not ready now. Set a suitable future follow-up.</p>
      <p><strong>18. Disqualified:</strong> The opportunity is not suitable for BXB.</p>
      <p><strong>19. Duplicate:</strong> The record is a duplicate. Follow the authorized review process.</p>

      <h3>6.3 Updating a lead stage</h3>
      <p>Open the lead, find its current stage, select the correct new stage, check that the change matches what actually happened, and save the change. Do not move a lead forward just to make your numbers look better.</p>

      <h3>6.4 Important rule</h3>
      <p>Do not mark a business as Qualified simply because it answered your call. Do not mark a business as Won because somebody said they might be interested. Each stage must represent a real step in the sales process.</p>
    `
  },
  {
    id: 'ch9', title: 'Chapter 9 — Meetings', level: 2, roles: ['all'],
    content: `
      <h3>9.1 Why do we arrange meetings?</h3>
      <p>A meeting gives BXB an opportunity to understand a business more deeply. The goal is not to force somebody to buy something. The goal is to understand the business, identify its needs and determine whether BXB can help.</p>

      <h3>9.2 Creating a meeting</h3>
      <p>Open Meetings or open the related lead, press New Meeting, enter the meeting title, select the meeting type, select the date, select the start and end time, add the meeting link or location, add notes, and save. Whenever possible, create the meeting from the related lead.</p>

      <h3>9.3 Time zones</h3>
      <p>BXB works with people in different countries. Always confirm that the client understands the time in their own location.</p>

      <h3>9.4 Meeting statuses</h3>
      <p>Use the correct status: Proposed, Awaiting Confirmation, Confirmed, Completed, Cancelled, Rescheduled, No Show. Do not mark a proposed meeting as Confirmed until the other side has accepted it.</p>

      <h3>9.5 Preparing for a meeting</h3>
      <p>Review the business profile, read previous activity notes, understand the reason for the meeting, read the prospect's main problems, review the relevant BXB services, check who will attend, confirm the meeting time, and prepare useful questions.</p>

      <h3>9.6 During the meeting</h3>
      <p>Your main job is to listen and understand. Ask questions such as: What problem are you trying to solve? How do you currently handle this process? What would you like to improve? Do not promise technical features, prices or delivery dates that have not been approved.</p>

      <h3>9.7 After the meeting</h3>
      <p>Immediately record what the client explained, what problems were identified, what solutions may be useful, whether the client is interested, what information is missing, and what should happen next. Update the meeting outcome. Create a follow-up task when needed.</p>
    `
  },
  {
    id: 'ch10', title: 'Chapter 10 — Qualifying a Lead', level: 2, roles: ['all'],
    content: `
      <h3>10.1 What does qualification mean?</h3>
      <p>Qualification means checking whether a business is a suitable opportunity for BXB. Not every business will become a client. That is normal.</p>

      <h3>10.2 The five qualification areas</h3>
      <ul>
        <li><strong>1. Business Fit:</strong> Is the business a good possible match for BXB?</li>
        <li><strong>2. Identified Problem:</strong> What problem does the business have?</li>
        <li><strong>3. Decision-Maker:</strong> Have you identified the person who can make or approve the decision?</li>
        <li><strong>4. Interest:</strong> Has the business shown real interest?</li>
        <li><strong>5. Commercial Readiness:</strong> Is the business ready to consider a project? Do not pressure a prospect to reveal private financial information.</li>
      </ul>

      <h3>10.3 Saving a qualification</h3>
      <p>Open the lead, find the Qualification section, read the questions, enter what you actually know, leave unknown information clearly marked or empty when allowed, review your answers, and save the draft or submit it for review.</p>

      <h3>10.4 Draft, Submitted, Approved and Returned</h3>
      <p><strong>Draft:</strong> You are still working on the information.</p>
      <p><strong>Submitted:</strong> You have sent the qualification for review.</p>
      <p><strong>Approved:</strong> The authorized reviewer has accepted it.</p>
      <p><strong>Returned:</strong> The reviewer needs more information or changes.</p>
      <p>Remember: A qualification score is only a guide. Honest information is more important than a high score.</p>
    `
  },
  {
    id: 'ch11', title: 'Chapter 11 — Technical Handovers', level: 2, roles: ['all'],
    content: `
      <h3>11.1 What is a technical handover?</h3>
      <p>A technical handover is a request to the BXB technical side. It tells the technical team what the client needs. You do not need to know how to build the requested system. You need to explain the business problem clearly.</p>

      <h3>11.2 When should you submit one?</h3>
      <p>Submit a technical handover when: The business has explained a real problem, You understand the main requirement, There is enough information for technical review, The opportunity is suitable for discussion with BXB, and The next step requires technical assessment.</p>

      <h3>11.3 Creating a handover</h3>
      <p>Open Technical Handovers, press New Request, select or enter the business, enter the project title, explain the client's problem and current process, describe the result the client wants, add relevant existing software or website information, add important integrations if known, add the timeline, add budget information only when the client has provided it, add relevant notes or documents, review the information, and submit the request.</p>

      <h3>11.4 Writing a good technical request</h3>
      <p><strong>Bad example:</strong> "Client wants AI."</p>
      <p><strong>Good example:</strong> "The client receives many questions from customers through its website and social media pages. The team answers these questions manually. The client wants to explore whether an AI assistant could help answer common questions and direct complex requests to staff."</p>

      <h3>11.5 Understanding the handover status</h3>
      <p>Possible statuses include: Draft, Submitted, Awaiting Review, Under Technical Assessment, More Information Required, Feasible, Feasible With Changes, Not Feasible, Proposal Preparation, Approved, and Closed.</p>

      <h3>11.6 Important technical rule</h3>
      <p>Never promise: A specific technical feature, A guaranteed result, A delivery date, or A final price. Unless the authorized BXB team has reviewed and approved it.</p>
    `
  },
  {
    id: 'ch12', title: 'Chapter 12 — Deals and Proposals', level: 2, roles: ['all'],
    content: `
      <h3>12.1 What is a deal?</h3>
      <p>A deal is a business opportunity that is being managed as a commercial project. A lead may develop into a deal when the opportunity is suitable for further commercial work.</p>

      <h3>12.2 Opening Deals</h3>
      <p>Open Deals, review the deals available to you, open a deal to see its details, check its stage, check its value and currency when available, read its notes, and review the next action.</p>

      <h3>12.3 Understanding deal stages</h3>
      <p>Stages include: Opportunity Created, Technical Assessment, Pricing Review, Proposal Draft, Internal Approval, Proposal Approved, Proposal Sent, Negotiation, Won, and Lost. Do not change deal stages just to make the pipeline look better.</p>

      <h3>12.4 What is a proposal?</h3>
      <p>A proposal is a document or offer that explains what BXB plans to provide to a client. It may contain the client's problem, the proposed solution, project scope, deliverables, exclusions, timeline, price, payment milestones, maintenance, and expiration date.</p>

      <h3>12.5 Your role in proposals</h3>
      <p>As a sales representative: Help collect the correct client information, Answer questions using approved materials, Share client feedback, Record changes requested by the client, Ask for approval when a change affects the scope or price, and Follow up at the agreed time.</p>
      <p>Do not edit approved prices or promise discounts without permission. Do not send an unapproved proposal as an official offer.</p>

      <h3>12.6 Proposal versions</h3>
      <p>A proposal may have different versions. Always check that you are sharing the correct approved version.</p>
    `
  },
  {
    id: 'ch13', title: 'Chapter 13 — Understanding BXB Services', level: 2, roles: ['all'],
    content: `
      <h3>13.1 Why should you know our services?</h3>
      <p>You do not have to become a technical expert. But you must understand the basic purpose of the services you represent.</p>

      <h3>13.2 Artificial Intelligence</h3>
      <p>AI can help a business perform certain tasks using intelligent software. Examples: Answering common customer questions, Helping staff find information, Organizing business information, Supporting internal workflows, and Processing certain types of information.</p>

      <h3>13.3 Business Automation</h3>
      <p>Automation means making repeated work happen with less manual effort.</p>

      <h3>13.4 API Integrations</h3>
      <p>An API allows different software systems to communicate. The technical team must check whether the required connection is possible.</p>

      <h3>13.5 Custom Software</h3>
      <p>Custom software is software designed for a particular business need.</p>

      <h3>13.6 Websites and Web Applications</h3>
      <p>A website presents information about a business. A web application can also allow users to perform tasks.</p>

      <h3>13.7 UI/UX Design</h3>
      <p>UI means User Interface (what people see). UX means User Experience (how easy it is to use).</p>

      <h3>13.8 Digital Transformation</h3>
      <p>Digital transformation means improving the way a business works through digital tools and technology.</p>

      <h3>13.9 The most important sales lesson</h3>
      <p>Do not start by trying to sell a technical feature. Start by understanding a business problem. Ask: "What is making your work difficult today?"</p>
    `
  },
  {
    id: 'ch14', title: 'Chapter 14 — Using the Resources Library', level: 2, roles: ['all'],
    content: `
      <h3>14.1 What is the Resources Library?</h3>
      <p>The Resources Library contains information that helps you do your job. It may include: PDFs, Brochures, Service explanations, Sales scripts, Training documents, Videos, Website links, Presentations, and Country-specific material.</p>

      <h3>14.2 Finding a resource</h3>
      <p>Open Resources, use the search field, select a category if available, open the resource, and read or watch the material.</p>

      <h3>14.3 Bookmarks</h3>
      <p>A bookmark helps you save a resource for later. Use bookmarks to find useful material more quickly.</p>

      <h3>14.4 Using resources when speaking to clients</h3>
      <p>Use approved material. Do not change official descriptions to make claims that are not approved. Do not share private internal documents with clients.</p>
    `
  },
  {
    id: 'ch15', title: 'Chapter 15 — Updates and Notifications', level: 2, roles: ['all'],
    content: `
      <h3>15.1 Updates Feed</h3>
      <p>The Updates section contains general information from BXB. Read important updates regularly.</p>

      <h3>15.2 Notifications</h3>
      <p>Notifications are messages about actions that may require your attention. Open the notification and read the message carefully. If an action is needed, complete it.</p>

      <h3>15.3 Difference between updates and notifications</h3>
      <p>An update is general information for a team or the whole network. A notification is usually connected to a specific event or action.</p>
    `
  },
  {
    id: 'ch16', title: 'Chapter 16 — Training and Playbooks', level: 2, roles: ['all'],
    content: `
      <h3>16.1 Training</h3>
      <p>The Training section helps you learn your work. Open a training module, read the lesson, watch the video if available, complete the knowledge check if provided, and mark the module as completed when you finish it.</p>

      <h3>16.2 Playbooks</h3>
      <p>A playbook is a guide that explains how to approach sales in a particular country or market. Open your assigned playbook, read the relevant sections, and use its approved materials when approaching businesses.</p>

      <h3>16.3 Ask for help</h3>
      <p>You are not expected to know everything from the first day. Ask your team leader when something is unclear. It is better to ask a question than to give a prospect incorrect information.</p>
    `
  },
  {
    id: 'ch17', title: 'Chapter 17 — Performance and Leaderboard', level: 2, roles: ['all'],
    content: `
      <h3>17.1 Understanding your performance</h3>
      <p>Your performance section helps you understand your progress. Depending on your role, you may see: Leads, Qualified opportunities, Meetings, Technical handovers, Proposals, Deals won, Conversion rates, and Follow-up completion.</p>

      <h3>17.2 Leaderboard</h3>
      <p>The leaderboard shows performance rankings. It is designed to encourage progress and useful, honest work. Do not create fake leads, fake calls or fake meetings to increase your points.</p>

      <h3>17.3 Points</h3>
      <p>Points may be awarded for approved activities and results. Points are internal performance indicators. They are not automatically money, salary or commission.</p>
    `
  },
  {
    id: 'ch23', title: 'Chapter 23 — A Complete Example', level: 2, roles: ['all'],
    content: `
      <h3>Step 1 — Find the business</h3>
      <p>You research ABC Business. You find its public business information and identify an appropriate contact method.</p>
      <h3>Step 2 — Create the lead</h3>
      <p>You search BXB to check whether the business already exists. It does not appear as a duplicate. You create the lead.</p>
      <h3>Step 3 — Make the first contact</h3>
      <p>You contact the business. You introduce yourself and explain that you work with BXB.</p>
      <h3>Step 4 — Record the activity</h3>
      <p>You log the phone call: "Spoke with the operations manager. The business wants to improve its customer communication process."</p>
      <h3>Step 5 — Create a follow-up</h3>
      <p>You create a follow-up task: "Send approved BXB introduction."</p>
      <h3>Step 6 — Receive a response</h3>
      <p>The business replies and agrees to a meeting. You update the lead.</p>
      <h3>Step 7 — Schedule the meeting</h3>
      <p>You create a meeting inside BXB with the correct date, time and meeting link.</p>
      <h3>Step 8 — Hold the discovery meeting</h3>
      <p>You ask the business about its needs, take useful notes, and record the meeting outcome.</p>
      <h3>Step 9 — Qualify the opportunity</h3>
      <p>You complete the qualification form and submit it for review.</p>
      <h3>Step 10 — Technical handover</h3>
      <p>You submit the business requirements to the BXB technical side. The technical team reviews the request.</p>
      <h3>Step 11 — Proposal preparation</h3>
      <p>If the opportunity is technically suitable, the authorized BXB team prepares and reviews a proposal.</p>
      <h3>Step 12 — Follow up</h3>
      <p>The proposal is sent through the approved process. You record the next follow-up.</p>
      <h3>Step 13 — Final result</h3>
      <p>The business accepts or declines the proposal. The correct result is recorded.</p>
    `
  },
  {
    id: 'ch24', title: 'Chapter 24 — Common Problems', level: 2, roles: ['all'],
    content: `
      <h3>Problem 1 — I cannot log in</h3>
      <p>Check: Is your User ID correct? Is your password correct? Are there spaces before or after your User ID? Is your internet working? If you still cannot log in, contact your administrator.</p>

      <h3>Problem 2 — I cannot see a lead</h3>
      <p>Possible reasons: The lead belongs to another representative, The lead belongs to another team, You do not have permission to see it, The lead has not been assigned to you. Ask your team leader.</p>

      <h3>Problem 3 — I cannot save a form</h3>
      <p>Check required fields, internet connection, any error message, and whether the information is valid. Try again when the connection is available.</p>

      <h3>Problem 4 — I entered the wrong information</h3>
      <p>Do not create another lead immediately. Open the existing record. If you have permission to edit it, correct the information.</p>

      <h3>Problem 5 — I created a duplicate</h3>
      <p>Do not create more records. Report the duplicate through the available process.</p>

      <h3>Problem 6 — The technical team requested more information</h3>
      <p>Open the handover, read the comment, understand exactly what information is missing, contact the appropriate business representative, and update the handover.</p>

      <h3>Problem 7 — I cannot access a page</h3>
      <p>Your role may not have permission to access that page. Contact your team leader if you believe you need access.</p>

      <h3>Problem 8 — The application is slow</h3>
      <p>Check your internet connection, close unnecessary browser tabs, refresh the application, and reopen the page.</p>
    `
  },
  {
    id: 'ch25', title: 'Chapter 25 — Simple Glossary', level: 2, roles: ['all'],
    content: `
      <p><strong>Application:</strong> The BXB software you use for work.</p>
      <p><strong>Dashboard:</strong> Your main working page.</p>
      <p><strong>Lead:</strong> A business that may become a client.</p>
      <p><strong>Prospect:</strong> A possible client you are trying to contact.</p>
      <p><strong>CRM:</strong> A system used to organize businesses, contacts and sales opportunities.</p>
      <p><strong>Pipeline:</strong> The stages a lead or opportunity passes through.</p>
      <p><strong>Activity:</strong> Something you did, such as a call or message.</p>
      <p><strong>Follow-up:</strong> Contacting a business again at the right time.</p>
      <p><strong>Task:</strong> Something you need to do.</p>
      <p><strong>Meeting:</strong> A planned conversation with a business or team member.</p>
      <p><strong>Qualification:</strong> Checking whether an opportunity is suitable.</p>
      <p><strong>Technical Handover:</strong> Sending client requirements to the technical team for review.</p>
      <p><strong>Technical Assessment:</strong> Checking whether a requested solution can be built.</p>
      <p><strong>Deal:</strong> A commercial business opportunity being managed by BXB.</p>
      <p><strong>Proposal:</strong> An offer explaining the solution and its commercial terms.</p>
      <p><strong>Won:</strong> A successful opportunity confirmed through the approved process.</p>
      <p><strong>Lost:</strong> An opportunity that did not become a successful deal.</p>
      <p><strong>Nurture:</strong> Keeping a possible opportunity for future contact.</p>
      <p><strong>Duplicate:</strong> A record that may already exist.</p>
      <p><strong>Team Leader:</strong> The person who manages a particular team.</p>
      <p><strong>Administrator:</strong> A person with authorized management access to the BXB system.</p>
    `
  },

  // ================= LEVEL 3 =================
  {
    id: 'ch18', title: 'Chapter 18 — Team Leader Guide', level: 3, roles: ['admin', 'team_leader'],
    content: `
      <h3>18.1 Your job as team leader</h3>
      <p>Your job is to organize and support your team. Main responsibilities include: Supporting representatives, Organizing lead assignments, Reviewing sales activities, Monitoring follow-ups, Reviewing meetings, Checking qualified opportunities, Monitoring team results, Helping representatives improve, Escalating technical questions, and Communicating with BXB.</p>

      <h3>18.2 Reviewing your team</h3>
      <p>Open your team dashboard and review: Team members, Assigned leads, Contact activity, Qualified opportunities, Meetings, Follow-ups, Open deals, and Team performance.</p>

      <h3>18.3 Assigning leads</h3>
      <p>Open the lead, find the assignment section, select the correct representative, check the assignment, and confirm the change. Avoid assigning too many leads to one person while other team members have no work.</p>

      <h3>18.4 Supporting inactive leads</h3>
      <p>If a lead has not been updated for a long time: Open the lead, review the activity history, check the assigned representative, ask for an update if necessary, and decide whether the lead should remain assigned. Do not judge a representative using only the number of calls.</p>

      <h3>18.5 Reviewing reports</h3>
      <p>Use the available reports to understand: Which activities are happening, Which leads are progressing, Which opportunities need help, Which stages are causing delays, and Which representatives need support. Use reports to improve the team, not only to rank people.</p>
    `
  },
  {
    id: 'ch19', title: 'Chapter 19 — Technical Collaborator Guide', level: 3, roles: ['admin', 'dev'],
    content: `
      <h3>19.1 Your role</h3>
      <p>Your job is to help assess and deliver the solutions requested by the sales team. You may receive technical handover requests. Your role is to review the information and explain what may be possible.</p>

      <h3>19.2 Reviewing a handover</h3>
      <p>Open Technical Handovers, find a request assigned to you or shared with you, open the request, read the business problem and requested result, review the existing software and integrations, check the available attachments, identify missing information, and record your findings.</p>

      <h3>19.3 Technical assessment</h3>
      <p>Record useful information: Is the project technically possible? What solution do you recommend? What risks exist? What additional information is needed? What resources may be required? What is the estimated complexity? What timeline may be realistic?</p>

      <h3>19.4 Returning feedback</h3>
      <p>If information is missing: Add a clear comment, explain exactly what is missing, update the status if authorized, and return the request for more information.</p>
    `
  },
  {
    id: 'ch20', title: 'Chapter 20 — Administrator Guide', level: 3, roles: ['admin'],
    content: `
      <h3>20.1 Global management</h3>
      <p>The administrator manages the central BXB workspace. Tools may include: User ID generation, Member management, Country management, Team creation, Role management, Lead assignment, Global reporting, Service management, Resources, Training, Targets, Notifications, Audit logs, and Commercial records.</p>

      <h3>20.2 Managing members</h3>
      <p>When a new team member joins: Create or generate their User ID, Select the appropriate account type, Connect them to the correct team, Confirm the required role, Give them the information needed to access BXB, and Check their account status. Do not give administrator permissions to ordinary representatives.</p>

      <h3>20.3 Managing countries and teams</h3>
      <p>Use the team management tools to organize the network. Keep team names and countries accurate.</p>

      <h3>20.4 Managing sales information</h3>
      <p>Administrators may review global sales information. Private commercial information must only be available to authorized people.</p>

      <h3>20.5 Audit history</h3>
      <p>Use audit logs to review important administrative actions. Do not attempt to hide or erase historical records improperly.</p>
    `
  },
  {
    id: 'ch21', title: 'Chapter 21 — Data Protection', level: 3, roles: ['all'],
    content: `
      <h3>21.1 Protect your account</h3>
      <p>Never share your password. Do not let another person use your account. Log out when using a device that other people can access.</p>

      <h3>21.2 Protect client information</h3>
      <p>Treat business information with care. Do not: Share private client information unnecessarily, Upload client passwords, Upload secret API keys, Upload payment card information, Share internal documents publicly, or Download private documents for unrelated purposes.</p>

      <h3>21.3 Be honest</h3>
      <p>Always record what really happened. Never create fake leads, fake client responses, fake meetings, fake opportunities, fake deal results, or fake activities.</p>

      <h3>21.4 Do not make promises without approval</h3>
      <p>You must not independently promise: A final project price, A delivery date, A discount, A guaranteed business result, A technical feature that has not been reviewed, or A contract condition that has not been approved.</p>

      <h3>21.5 Respect business communication rules</h3>
      <p>When contacting a business: Be polite, Introduce yourself honestly, Use appropriate business contact channels, Respect requests not to be contacted, and Follow the communication rules that apply in your country.</p>
    `
  },
  {
    id: 'ch26', title: 'Chapter 26 — Your First Seven Days', level: 3, roles: ['all'],
    content: `
      <h3>DAY 1 — Get comfortable</h3>
      <p>Log in, complete your profile, explore the dashboard, open the navigation menu, read the BXB introduction, learn where your resources are.</p>
      <h3>DAY 2 — Understand the services</h3>
      <p>Open the Services section, read the basic descriptions, open the relevant brochures, watch available videos, read your country's playbook.</p>
      <h3>DAY 3 — Learn the CRM</h3>
      <p>Open Leads, learn what a lead is, understand the lead information, learn how to search and create a lead, and understand duplicate warnings.</p>
      <h3>DAY 4 — Learn activities and tasks</h3>
      <p>Learn how to record a call and write useful notes. Create a practice task if your team permits it. Understand due dates and priorities.</p>
      <h3>DAY 5 — Learn meetings and qualification</h3>
      <p>Learn how to schedule meetings and understand meeting statuses. Read the qualification section and learn the five qualification areas.</p>
      <h3>DAY 6 — Learn technical handovers</h3>
      <p>Read the handover instructions, learn how to describe a business problem, understand what the technical team needs, and review an example with your team leader.</p>
      <h3>DAY 7 — Review and practice</h3>
      <p>Review what you learned, complete available training, ask questions, and make sure you can perform the main daily tasks.</p>
    `
  },
  {
    id: 'ch27', title: 'Chapter 27 — The BXB Way of Working', level: 3, roles: ['all'],
    content: `
      <p>At BXB, we value:</p>
      <ul>
        <li><strong>Honesty:</strong> Record real information and communicate honestly.</li>
        <li><strong>Organization:</strong> Keep leads, tasks and activities updated.</li>
        <li><strong>Communication:</strong> Ask questions when you need help.</li>
        <li><strong>Professionalism:</strong> Respect businesses, clients and team members.</li>
        <li><strong>Teamwork:</strong> Sales and technical collaborators need each other.</li>
        <li><strong>Responsibility:</strong> Do not make promises you cannot approve.</li>
        <li><strong>Consistency:</strong> Good sales work requires regular, useful follow-ups.</li>
      </ul>
      <p>You do not need to know everything on your first day. You do need to be willing to learn, communicate and work responsibly.</p>
      <p><strong>Welcome to the BXB network.</strong></p>
    `
  }
];

export default function Help() {
  const { profile } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profile) {
      const stored = localStorage.getItem(`bxb-academy-${profile.id}`);
      if (stored) setCompleted(new Set(JSON.parse(stored)));
    }
  }, [profile]);

  function toggleComplete(id: string) {
    const next = new Set(completed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCompleted(next);
    if (profile) localStorage.setItem(`bxb-academy-${profile.id}`, JSON.stringify(Array.from(next)));
  }

  const visibleChapters = useMemo(() => {
    const role = profile?.role || 'member';
    return CHAPTERS.filter(ch => ch.roles.includes('all') || ch.roles.includes(role));
  }, [profile]);

  const filteredChapters = useMemo(() => {
    if (!search) return visibleChapters;
    const q = search.toLowerCase();
    return visibleChapters.filter(ch => ch.title.toLowerCase().includes(q) || ch.content.toLowerCase().includes(q));
  }, [visibleChapters, search]);

  const activeChapter = visibleChapters.find(ch => ch.id === activeId);
  const activeIndex = visibleChapters.findIndex(ch => ch.id === activeId);
  const prevChapter = activeIndex > 0 ? visibleChapters[activeIndex - 1] : null;
  const nextChapter = activeIndex >= 0 && activeIndex < visibleChapters.length - 1 ? visibleChapters[activeIndex + 1] : null;

  const levels = [
    { num: 1, title: 'Level 1 — Start Here', icon: BookOpen, desc: 'Basic app use, login, dashboard, leads, activities and tasks.' },
    { num: 2, title: 'Level 2 — Learn Your Job', icon: Target, desc: 'Sales pipeline, qualification, meetings, technical handovers, proposals and services.' },
    { num: 3, title: 'Level 3 — Advanced Operations', icon: Shield, desc: 'Team leaders, technical collaborators, administrators, reporting and network management.' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto flex flex-col md:flex-row gap-6 md:gap-8 animate-enter min-h-screen">
      
      {/* SIDEBAR / LIST */}
      <aside className={`${activeId ? 'hidden md:block' : 'block'} md:w-72 shrink-0`}>
        <div className="mb-5">
          <h1 className="page-title">BXB Academy</h1>
          <p className="text-[13px] text-text-secondaryLight dark:text-text-secondaryDark">
            Learn how to use the system and do your daily work.
          </p>
        </div>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mutedLight dark:text-text-mutedDark" size={16} />
          <input
            type="text"
            placeholder="Search chapters..."
            className="input-field !pl-10 text-[13px]"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-6">
          {levels.map(level => {
            const levelChapters = filteredChapters.filter(c => c.level === level.num);
            if (levelChapters.length === 0) return null;
            return (
              <div key={level.num}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <level.icon size={15} className="text-brand-primary" />
                  <h3 className="text-[13px] font-bold uppercase tracking-wider">{level.title}</h3>
                </div>
                <div className="space-y-0.5">
                  {levelChapters.map(ch => {
                    const isActive = activeId === ch.id;
                    const isDone = completed.has(ch.id);
                    return (
                      <button
                        key={ch.id}
                        onClick={() => setActiveId(ch.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors flex items-center justify-between gap-2 ${
                          isActive
                            ? 'bg-brand-primary/10 text-brand-primary font-semibold'
                            : 'hover:bg-black/5 dark:hover:bg-white/5 text-text-secondaryLight dark:text-text-secondaryDark'
                        }`}
                      >
                        <span className="truncate">{ch.title}</span>
                        {isDone && <CheckCircle2 size={14} className="text-state-success shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* CONTENT */}
      <main className={`${activeId ? 'block' : 'hidden md:block'} flex-1 min-w-0`}>
        {activeChapter ? (
          <div className="max-w-3xl">
            <button
              onClick={() => setActiveId(null)}
              className="md:hidden flex items-center gap-1 text-[13px] font-semibold text-brand-primary mb-4"
            >
              <ArrowLeft size={16} /> Back to chapters
            </button>

            <div className="mb-6">
              <p className="eyebrow text-brand-primary mb-1">Level {activeChapter.level}</p>
              <h1 className="text-[24px] md:text-[28px] font-bold tracking-tight leading-tight mb-2">{activeChapter.title}</h1>
              <div className="flex items-center gap-3 text-[12px] text-text-mutedLight dark:text-text-mutedDark">
                <span>{Math.ceil(activeChapter.content.length / 1000)} min read</span>
                {completed.has(activeChapter.id) && (
                  <span className="flex items-center gap-1 text-state-success font-semibold">
                    <CheckCircle2 size={12} /> Completed
                  </span>
                )}
              </div>
            </div>

            <div
              className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h3:text-[16px] md:prose-h3:text-[18px] prose-h3:mt-6 prose-h3:mb-2 prose-p:text-[14px] md:prose-p:text-[15px] prose-p:leading-relaxed prose-p:mb-3 prose-li:text-[14px] md:prose-li:text-[15px] prose-li:mb-1 prose-strong:text-text-primaryLight dark:prose-strong:text-text-primaryDark"
              dangerouslySetInnerHTML={{ __html: activeChapter.content }}
            />

            <div className="mt-8 pt-6 border-t border-borderLight dark:border-borderDark flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => toggleComplete(activeChapter.id)}
                className={`btn-secondary w-full sm:w-auto ${completed.has(activeChapter.id) ? '!border-state-success !text-state-success' : ''}`}
              >
                {completed.has(activeChapter.id) ? (
                  <><CheckCircle2 size={16} /> Completed</>
                ) : (
                  <><CheckCircle2 size={16} /> Mark as completed</>
                )}
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {prevChapter && (
                  <button
                    onClick={() => setActiveId(prevChapter.id)}
                    className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-1 !px-3"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                )}
                {nextChapter && (
                  <button
                    onClick={() => setActiveId(nextChapter.id)}
                    className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-1 !px-4"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-4 text-brand-primary">
              <BookOpen size={32} />
            </div>
            <h2 className="text-[20px] font-bold tracking-tight mb-2">Welcome to BXB Academy</h2>
            <p className="text-[14px] text-text-secondaryLight dark:text-text-secondaryDark max-w-sm mb-6">
              Select a chapter from the left menu to start learning. The guide is organized into three levels, from basic app usage to advanced administration.
            </p>
            <div className="grid grid-cols-3 gap-3 w-full max-w-md text-left">
              {levels.map(l => (
                <div key={l.num} className="card !p-3 text-center">
                  <l.icon size={18} className="text-brand-primary mx-auto mb-1.5" />
                  <p className="text-[12px] font-bold">Level {l.num}</p>
                  <p className="text-[10px] text-text-mutedLight dark:text-text-mutedDark leading-tight mt-0.5">{l.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


