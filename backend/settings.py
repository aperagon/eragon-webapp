import os
from pathlib import Path
from typing import Dict, Any, List

# Base configuration
BASE_DIR = Path(__file__).parent.parent
SFDX_DIR = os.getenv("SFDX_DIR", str(BASE_DIR))
SALESFORCE_ORG = os.getenv("SALESFORCE_ORG", "my-org")

# OpenAI Configuration
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Streamlit Configuration
STREAMLIT_CONFIG = {
    "page_title": "Salesforce Data Analyst",
    "page_icon": "⚡",
    "layout": "wide",
    "initial_sidebar_state": "expanded"
}

# Agent Instructions
AGENT_INSTRUCTIONS = """
You are a Salesforce data analyst assistant. You have access to various tools to query and analyze Salesforce data.

Available capabilities:
- Query Salesforce data with SOQL

Always provide clear, actionable insights based on the data you retrieve.
When presenting data, format it in a clear, easy-to-read manner with key insights highlighted.
If you are not able to answer the question in the first tool call, persist the question and call the tool again.
"""

# Salesforce Schema Documentation - Core Sales Objects
SALESFORCE_SCHEMA = {
    "core_objects": {
        "Account": {
            "description": "Represents a business or individual account (organization or person) involved with your business. In Salesforce, Accounts typically represent companies or customers. Accounts can also function as 'person accounts' (combining account and contact data in one record) if that feature is enabled.",
            "key_fields": {
                "Id": "Primary Key (ID) - The unique record ID (15/18-character Salesforce ID)",
                "Name": "Text (Account Name) - The primary name of the account (e.g. company name); up to 255 characters",
                "AccountNumber": "Text - An identifying account number (up to 40 chars)",
                "Site": "Text - Additional site/location info for the account (up to 80 chars)",
                "Type": "Picklist - Type of account (e.g. Customer, Partner, Prospect, etc.)",
                "Industry": "Picklist - Industry sector of the account (e.g. Banking, Technology)",
                "AnnualRevenue": "Currency - Annual revenue of the account (18 digits, 0 decimal places)",
                "Rating": "Picklist - A rating for the account (e.g. Hot, Warm, Cold)",
                "Ownership": "Picklist - Ownership type (e.g. Public, Private)",
                "Phone": "Phone - Primary phone number (40 chars)",
                "Fax": "Phone - Fax number (40 chars)",
                "Website": "URL - Account's website URL (255 chars)",
                "TickerSymbol": "Text - Stock ticker symbol (usually 10–20 chars)",
                "Description": "Long Text - Description or notes about the account (up to 32,000 chars)",
                "BillingStreet": "Text/Textarea - Billing street address",
                "BillingCity": "Text - Billing city",
                "BillingState": "Text - Billing state/province",
                "BillingPostalCode": "Text - Billing postal code",
                "BillingCountry": "Text - Billing country",
                "ShippingStreet": "Text/Textarea - Shipping street address",
                "ShippingCity": "Text - Shipping city",
                "ShippingState": "Text - Shipping state/province",
                "ShippingPostalCode": "Text - Shipping postal code",
                "ShippingCountry": "Text - Shipping country",
                "NumberOfEmployees": "Number - Number of employees (8 digits)",
                "AccountSource": "Picklist - The source of the account record (e.g. Web, Referral, Trade Show)",
                "Sic": "Text - SIC code for the account's industry (20 chars)",
                "OwnerId": "Lookup (User) - The owner of the account (typically a user)",
                "ParentId": "Lookup (Account) - If populated, links to another Account (the parent account for hierarchy)",
                "CreatedDate": "Datetime - Date/time the account was created",
                "CreatedById": "Lookup (User) - User who created the record",
                "LastModifiedDate": "Datetime - Last modified date/time",
                "LastModifiedById": "Lookup (User) - User who last modified the record",
                "SystemModstamp": "Datetime - System modification timestamp (for replication)",
                "IsDeleted": "Checkbox - True if the record has been deleted (soft delete)",
                "MasterRecordId": "Lookup (Account) - Used for merge operations (points to master record when merged)",
                "IsPersonAccount": "Checkbox - True if this is a Person Account record",
                "PersonContactId": "Lookup (Contact) - If person accounts are enabled, this links the account to its underlying contact record"
            },
            "relationships": [
                "Account Owner (OwnerId) - Lookup to the User who owns the account",
                "Parent Account (ParentId) - Lookup to another Account (the parent in an account hierarchy)",
                "Contacts - One Account can have many Contact records related to it via Contact's AccountId lookup field",
                "Opportunities - One Account can have many Opportunity records via Opportunity's AccountId field",
                "Tasks/Activities - Accounts can have many related Task and Event records through the WhatId field",
                "Account Hierarchies - Accounts are self-referencing via ParentId for parent-subsidiary relationships"
            ]
        },
        "Contact": {
            "description": "Represents a contact, an individual person associated with an account (for example, a customer or prospect). Contacts typically store personal details of people at companies (accounts) or individual customers.",
            "key_fields": {
                "Id": "Primary Key (ID) - Unique contact record ID",
                "Name": "Name (compound) - The contact's full name, stored as separate fields",
                "FirstName": "String (40) - Contact's first name",
                "LastName": "String (80) - Contact's last name",
                "Salutation": "Picklist - Salutation (e.g. Mr./Ms.)",
                "AccountId": "Lookup (Account) - The Account that this contact is associated with",
                "OwnerId": "Lookup (User) - The owner/assigned user for the contact",
                "Title": "Text - Job title of the contact (80 chars)",
                "Department": "Text - Department name (80 chars)",
                "Email": "Email - Contact's email address (80 chars)",
                "Phone": "Phone - Business phone number (40 chars)",
                "MobilePhone": "Phone - Mobile phone number",
                "Fax": "Phone - Fax number (40 chars)",
                "MailingStreet": "Text/Textarea - Mailing street address",
                "MailingCity": "Text - Mailing city",
                "MailingState": "Text - Mailing state/province",
                "MailingPostalCode": "Text - Mailing postal code",
                "MailingCountry": "Text - Mailing country",
                "OtherStreet": "Text/Textarea - Alternate street address",
                "OtherCity": "Text - Alternate city",
                "OtherState": "Text - Alternate state/province",
                "OtherPostalCode": "Text - Alternate postal code",
                "OtherCountry": "Text - Alternate country",
                "Birthdate": "Date - Contact's birth date",
                "Description": "Long Text - Description or background info (up to 32k chars)",
                "LeadSource": "Picklist - How the contact was acquired (values shared with Lead Source)",
                "DoNotCall": "Checkbox - If checked, indicates the contact should not be called",
                "HasOptedOutOfEmail": "Checkbox - True if the contact opted out of marketing emails",
                "HasOptedOutOfFax": "Checkbox - True if opted out of fax communications",
                "EmailBouncedDate": "Datetime - The date/time the last email to this contact bounced",
                "EmailBouncedReason": "Text - The reason for email bounce (255 chars)",
                "ReportsToId": "Lookup (Contact) - The contact that this contact reports to",
                "AssistantName": "Text - Name of the contact's assistant (40 chars)",
                "AssistantPhone": "Phone - Assistant's phone number (40 chars)",
                "HomePhone": "Phone - Home phone number",
                "OtherPhone": "Phone - Other alternate phone number",
                "CreatedDate": "Datetime - When the contact was created",
                "CreatedById": "Lookup (User) - User who created the contact",
                "LastModifiedDate": "Datetime - Last modified timestamp",
                "LastModifiedById": "Lookup (User) - User who last modified",
                "LastActivityDate": "Date - The date of the last related activity (task, call, etc.)",
                "IsDeleted": "Checkbox - True if the record is deleted",
                "MasterRecordId": "Lookup (Contact) - Used if the contact was merged",
                "SystemModstamp": "Datetime - System modification timestamp"
            },
            "relationships": [
                "Account (AccountId) - Lookup to the Account that the contact belongs to",
                "Contact Owner (OwnerId) - Lookup to User who owns the contact",
                "Reports To (ReportsToId) - Lookup to another Contact (usually this contact's manager)",
                "Opportunities - Contacts are related to Opportunity records through Opportunity Contact Roles",
                "Activities - Contacts can have associated Tasks/Events via Task's WhoId field",
                "Account-Contact Relationships - If Contacts to Multiple Accounts is enabled, contacts can be affiliated with multiple accounts"
            ]
        },
        "Lead": {
            "description": "Represents a sales lead – an unqualified prospect or potential opportunity (typically an individual or company that expressed interest). In Salesforce, Leads contain prospect information that can be converted into an Account, Contact, and Opportunity once qualified.",
            "key_fields": {
                "Id": "Primary Key (ID) - Unique lead record ID",
                "Name": "Name (compound) - The lead's name, split into separate fields",
                "FirstName": "String (40) - Lead's first name",
                "LastName": "String (80) - Lead's last name",
                "Salutation": "Picklist - Salutation (e.g. Mr., Ms.)",
                "Company": "Text - Company or organization name associated with the lead (255 chars, required)",
                "Title": "Text - Job title of the lead (80 chars)",
                "Status": "Picklist - The status/stage of the lead in the lead process (e.g. Open, Contacted, Qualified, Converted)",
                "LeadSource": "Picklist - Source of the lead (e.g. Web, Phone Inquiry, Referral)",
                "Industry": "Picklist - Industry of the lead's company",
                "AnnualRevenue": "Currency - Annual revenue of the lead's company (18,0)",
                "Phone": "Phone - Lead's phone number (40 chars)",
                "MobilePhone": "Phone - Mobile phone (40 chars)",
                "Fax": "Phone - Fax number (40 chars)",
                "Email": "Email - Lead's email address (80 chars)",
                "Website": "URL - Website associated with the lead or company (255 chars)",
                "Street": "Textarea - Street address (255 chars)",
                "City": "Text - City (40 chars)",
                "State": "Text - State/province (20 chars)",
                "PostalCode": "Text - Postal code (20 chars)",
                "Country": "Text - Country (40 chars)",
                "NumberOfEmployees": "Number - Number of employees at the lead's company (8 digits)",
                "Description": "Long Text - Description or notes about the lead (up to 32k chars)",
                "OwnerId": "Lookup (User) - The owner of the lead (typically a sales rep)",
                "Rating": "Picklist - Rating of lead quality (Hot, Warm, Cold, etc.)",
                "DoNotCall": "Checkbox - Do not call indicator",
                "HasOptedOutOfEmail": "Checkbox - Opt-out of email indicator",
                "HasOptedOutOfFax": "Checkbox - Opt-out of fax indicator",
                "EmailBouncedDate": "Datetime - Date of email bounce",
                "EmailBouncedReason": "Text - Reason for email bounce (255 chars)",
                "IsConverted": "Checkbox - True if the lead has been converted to an account/contact",
                "ConvertedDate": "Date - The date when the lead was converted",
                "ConvertedAccountId": "Lookup (Account) - If converted, references the new or existing Account",
                "ConvertedContactId": "Lookup (Contact) - If converted, the new Contact's ID",
                "ConvertedOpportunityId": "Lookup (Opportunity) - If converted and an opportunity was created, this is its ID",
                "CreatedDate": "Datetime - When the lead was created",
                "CreatedById": "Lookup (User) - User who created the lead",
                "LastModifiedDate": "Datetime - Last modified timestamp",
                "LastModifiedById": "Lookup (User) - User who last modified",
                "LastActivityDate": "Date - Last activity date (last task/event logged)",
                "UnreadByOwner": "Checkbox - True if the lead's owner has not yet viewed the lead",
                "MasterRecordId": "Lookup (Lead) - If the lead was merged, points to the surviving lead record",
                "SystemModstamp": "Datetime - System modification timestamp",
                "PartnerAccountId": "Lookup (Account) - If the lead was provided by a partner account, references that Account"
            },
            "relationships": [
                "Lead Owner (OwnerId) - Lookup to User (or queue) who owns the lead",
                "Converted Account (ConvertedAccountId) - Lookup to Account created during conversion",
                "Converted Contact (ConvertedContactId) - Lookup to Contact created from the lead",
                "Converted Opportunity (ConvertedOpportunityId) - Lookup to Opportunity created from the lead",
                "Partner Account (PartnerAccountId) - Lookup to Account (partner) associated with the lead",
                "Campaigns - Leads can be linked to marketing campaigns through the CampaignMember object",
                "Tasks/Activities - A Task can be related to a Lead via the WhoId field (polymorphically)",
                "Lead Conversion - When converted, maps many lead fields to new account/contact fields"
            ]
        },
        "Opportunity": {
            "description": "Represents an opportunity – a potential or pending sale/deal in pipeline management. Opportunities are tied to accounts and track details of the deal (stage, amount, close date, etc.). This is a central object in Sales Cloud for forecasting and revenue tracking.",
            "key_fields": {
                "Id": "Primary Key (ID) - Unique opportunity record ID",
                "Name": "Text - Opportunity name (often a short description of the deal; up to 120 chars)",
                "AccountId": "Lookup (Account) - The Account related to this opportunity (the customer account for the deal)",
                "OwnerId": "Lookup (User) - The owner (sales rep) for the opportunity",
                "StageName": "Picklist - The sales Stage of the opportunity (e.g. Prospecting, Proposal, Negotiation, Closed Won, Closed Lost)",
                "CloseDate": "Date - The expected close date of the opportunity (when the deal is expected to be won/closed)",
                "Amount": "Currency - The amount of the potential sale (forecast amount)",
                "Probability": "Percent - Win probability (0–100%) tied to the stage",
                "ExpectedRevenue": "Currency - Calculated as Amount * Probability (read-only by default)",
                "Type": "Picklist - Type of opportunity (e.g. New Business, Existing Business, Renewal)",
                "LeadSource": "Picklist - How the opportunity originated (e.g. Web, Phone Inquiry, etc.)",
                "NextStep": "Text - Next action or step to take (255 chars)",
                "Description": "Long Text - Description or background details about the deal (32k chars)",
                "ForecastCategory": "Picklist - Forecast category (e.g. Pipeline, Best Case, Commit) often derived from the stage",
                "ForecastCategoryName": "Picklist - Forecast category name",
                "HasOpportunityLineItem": "Checkbox - True if the opportunity has related line items (products)",
                "IsClosed": "Checkbox - True if the opp is in a closed stage (Closed Won or Closed Lost)",
                "IsWon": "Checkbox - True if the opportunity's Stage is a closed/won stage",
                "CampaignId": "Lookup (Campaign) - Primary Campaign Source: a lookup to a Campaign most directly tied to this opportunity",
                "HasOpenActivity": "Checkbox - (Read-only) indicates if there are any open tasks/events on the opp",
                "LastActivityDate": "Date - The date of the last activity (task/event) on this opportunity",
                "StageLastModifiedDate": "Datetime - When the Stage was last changed",
                "Quantity": "Number (Double) - Total Opportunity Quantity: the quantity of products",
                "Pricebook2Id": "Lookup (Pricebook) - The Price Book associated with this opportunity (required if using Opportunity Products)",
                "SyncedQuoteId": "Lookup (Quote) - If using Quotes, this field links to the quote currently synced with the opportunity",
                "PartnerAccountId": "Lookup (Account) - If the deal involves a partner, this lookup stores the partner's account",
                "TerritoryId": "Lookup (Territory) - If territory management is enabled, this is the sales territory assignment",
                "IsPrivate": "Checkbox - If true, the opportunity is marked private (visible only to owner/manager)",
                "CreatedDate": "Datetime - When the opportunity was created",
                "CreatedById": "Lookup (User) - Who created it",
                "LastModifiedDate": "Datetime - Last modified timestamp",
                "LastModifiedById": "Lookup (User) - Who last modified",
                "SystemModstamp": "Datetime - System mod timestamp",
                "IsDeleted": "Checkbox - True if deleted"
            },
            "relationships": [
                "Account (AccountId) - Lookup to the Account that this opportunity is associated with",
                "Opportunity Owner (OwnerId) - Lookup to User who owns the opportunity",
                "Primary Campaign (CampaignId) - Lookup to Campaign (Primary Campaign Source)",
                "Price Book (Pricebook2Id) - Lookup to Pricebook (required if using Products)",
                "Opportunity Contact Roles - One-to-many relationship with OpportunityContactRole (links Opportunity to Contacts)",
                "Opportunity Products (Line Items) - One-to-many relationship to OpportunityLineItem (products being sold)",
                "Quotes - Opportunities can have multiple Quote records (via Quote's OpportunityId lookup)",
                "Partner Account (PartnerAccountId) - Lookup to an Account acting as a partner on the deal",
                "Territory (TerritoryId) - Lookup to Territory (if using Enterprise Territory Management)",
                "Activities - Opportunities can have Tasks/Events related via Task's WhatId field",
                "Opportunity Teams - Related OpportunityTeamMember object links Users to Opportunity with roles"
            ]
        }
    },
    "activity_objects": {
        "Task": {
            "description": "Represents a business activity or to-do item, such as a phone call or an email, that needs to be tracked. In the UI, Tasks and Events are collectively referred to as Activities. A Task is a specific action item with a due date and status.",
            "key_fields": {
                "Id": "Primary Key (ID) - Unique task record ID (also called 'Activity ID')",
                "Subject": "Text (combobox) - The subject or title of the task (up to 255 chars)",
                "Status": "Picklist - The status of the task (e.g. Not Started, In Progress, Completed, Deferred)",
                "Priority": "Picklist - Priority level (High, Normal, Low)",
                "ActivityDate": "Date - For tasks, this is typically the Due Date of the task",
                "Description": "Long Text - Detailed comments or description of the task (32k chars)",
                "WhoId": "Lookup (Contact or Lead) - The 'Name' field – links to a Contact or Lead that the task is regarding",
                "WhatId": "Lookup (Account, Opportunity, etc.) - The 'Related To' field – links to another object (polymorphic)",
                "AccountId": "Lookup (Account) - The account associated with the task (auto-populated based on context)",
                "OwnerId": "Lookup (User) - The owner of the task (the user to whom the task is assigned)",
                "IsClosed": "Checkbox - True if the task is closed (i.e. Status = Completed or another closed status)",
                "IsArchived": "Checkbox - True if the task is archived",
                "CallDurationInSeconds": "Number - Duration of the call in seconds (if task is a call log)",
                "CallType": "Picklist - Type of call (inbound, outbound)",
                "CallDisposition": "Text - Outcome of the call (e.g. Left Voicemail, Completed)",
                "CallObject": "Text - Identifier for the call (if integrated with phone systems)",
                "IsReminderSet": "Checkbox - True if an email or popup reminder is set for this task",
                "ReminderDateTime": "Datetime - When the reminder is scheduled (if IsReminderSet)",
                "IsRecurrence": "Checkbox - True if this task is part of a recurring series",
                "RecurrenceActivityId": "Lookup (Task) - The ID of the original task in a series",
                "RecurrenceInterval": "Number - Interval between recurrences (for daily/weekly etc.)",
                "RecurrenceType": "Picklist - Recurrence pattern (Daily, Weekly, Monthly, etc.)",
                "RecurrenceStartDateOnly": "Date - Start date of the recurrence series",
                "RecurrenceEndDateOnly": "Date - End date of the recurrence series",
                "ActivityType": "Picklist - High-level type of activity (e.g. Email, Call, Meeting)",
                "IsVisibleInSelfService": "Checkbox - If true, the task is visible in a self-service portal",
                "CreatedDate": "Datetime - When the task was created",
                "CreatedById": "Lookup (User) - Who created it",
                "LastModifiedDate": "Datetime - Last modification date",
                "LastModifiedById": "Lookup (User) - Who last modified",
                "SystemModstamp": "Datetime - System mod timestamp",
                "IsDeleted": "Checkbox - True if deleted (part of recycle bin)"
            },
            "relationships": [
                "Assigned To (OwnerId) - Lookup to User (or Queue) who is assigned the task",
                "Name (WhoId) - Polymorphic lookup to a Contact or Lead (person associated with task)",
                "Related To (WhatId) - Polymorphic lookup to another record (Account, Opportunity, Case, etc.)",
                "Account (AccountId) - Lookup to Account (auto-populated based on WhoId or WhatId context)",
                "Parent Task (RecurrenceActivityId) - Lookup to Task (self-relationship for recurring tasks)",
                "Activities on Account vs. Contact - Tasks related to Contacts automatically relate to their Account",
                "No Master-Detail - All relationships are lookup relationships (loosely coupled)"
            ]
        },
        "Event": {
            "description": "Represents calendar events and meetings. Events are similar to Tasks but focus on scheduled activities with specific start/end times rather than to-do items.",
            "key_fields": {
                "Id": "Primary Key (ID) - Unique event record ID",
                "Subject": "Text - Event description/title",
                "StartDateTime": "Datetime - Start date and time of the event",
                "EndDateTime": "Datetime - End date and time of the event",
                "Location": "Text - Event location",
                "Description": "Long Text - Detailed description of the event",
                "WhoId": "Lookup (Contact or Lead) - Person related to event",
                "WhatId": "Lookup (Account, Opportunity, etc.) - Object related to event",
                "OwnerId": "Lookup (User) - Event owner",
                "Type": "Picklist - Event type",
                "IsAllDayEvent": "Checkbox - All-day event flag",
                "ActivityType": "Picklist - High-level type of activity",
                "IsPrivate": "Checkbox - Private event flag",
                "ShowAs": "Picklist - How time shows in calendar (Busy, Free, etc.)",
                "IsRecurrence": "Checkbox - True if part of recurring series",
                "RecurrenceActivityId": "Lookup (Event) - Original event in recurring series",
                "CreatedDate": "Datetime - When the event was created",
                "CreatedById": "Lookup (User) - Who created it",
                "LastModifiedDate": "Datetime - Last modification date",
                "LastModifiedById": "Lookup (User) - Who last modified",
                "SystemModstamp": "Datetime - System modification timestamp",
                "IsDeleted": "Checkbox - True if deleted"
            },
            "relationships": [
                "Event Owner (OwnerId) - Lookup to User who owns the event",
                "Name (WhoId) - Polymorphic lookup to Contact or Lead",
                "Related To (WhatId) - Polymorphic lookup to Account, Opportunity, etc.",
                "Parent Event (RecurrenceActivityId) - Self-relationship for recurring events",
                "Similar relationship patterns to Tasks but for scheduled calendar activities"
            ]
        }
    },
    "product_objects": {
        "Product2": {
            "description": "Represents products or services that your organization sells.",
            "key_fields": {
                "Id": "Unique identifier",
                "Name": "Product name (required)",
                "ProductCode": "Product code/SKU",
                "Description": "Product description",
                "Family": "Product family/category",
                "IsActive": "Active status",
                "QuantityUnitOfMeasure": "Unit of measure"
            },
            "relationships": [
                "Has many Price Book Entries (one-to-many)",
                "Related to Opportunity Products through Price Book Entries"
            ]
        },
        "Pricebook2": {
            "description": "Contains lists of products and their prices. Organizations can have multiple price books for different markets or customer segments.",
            "key_fields": {
                "Id": "Unique identifier",
                "Name": "Price book name (required)",
                "Description": "Price book description",
                "IsActive": "Active status",
                "IsStandard": "Standard price book flag"
            },
            "relationships": [
                "Has many Price Book Entries (one-to-many)",
                "Related to Opportunities (one-to-many)"
            ]
        },
        "OpportunityLineItem": {
            "description": "Represents products added to opportunities. Also known as Opportunity Products.",
            "key_fields": {
                "Id": "Unique identifier",
                "OpportunityId": "Related opportunity (master-detail, required)",
                "PricebookEntryId": "Price book entry (lookup, required)",
                "Quantity": "Product quantity",
                "UnitPrice": "Unit price",
                "TotalPrice": "Total line price",
                "Description": "Line item description",
                "ServiceDate": "Service date"
            },
            "relationships": [
                "Child of Opportunity (master-detail)",
                "References PricebookEntry (lookup)",
                "Inherits Product2 reference through PricebookEntry"
            ]
        }
    },
    "campaign_objects": {
        "Campaign": {
            "description": "Represents marketing campaigns and programs.",
            "key_fields": {
                "Id": "Unique identifier",
                "Name": "Campaign name (required)",
                "Type": "Campaign type",
                "Status": "Campaign status",
                "StartDate": "Start date",
                "EndDate": "End date",
                "BudgetedCost": "Budgeted cost",
                "ActualCost": "Actual cost",
                "ExpectedRevenue": "Expected revenue",
                "OwnerId": "Campaign owner (User lookup)",
                "ParentId": "Parent campaign (Campaign lookup)"
            },
            "relationships": [
                "Can have Parent Campaign (lookup)",
                "Has many Campaign Members (one-to-many)",
                "Can influence Opportunities (one-to-many)"
            ]
        },
        "CampaignMember": {
            "description": "Junction object connecting Campaigns to Leads and Contacts.",
            "key_fields": {
                "Id": "Unique identifier",
                "CampaignId": "Related campaign (lookup, required)",
                "LeadId": "Related lead (lookup)",
                "ContactId": "Related contact (lookup)",
                "Status": "Member status",
                "HasResponded": "Response flag"
            },
            "relationships": [
                "Belongs to Campaign (lookup)",
                "Can relate to Lead OR Contact (mutually exclusive)"
            ]
        }
    }
}

# Pre-defined queries for common use cases
SAMPLE_QUERIES = {
    "Top Accounts by Revenue": {
        "query": "SELECT Id, Name, AnnualRevenue, Industry, Type FROM Account WHERE AnnualRevenue != NULL ORDER BY AnnualRevenue DESC LIMIT 10",
        "description": "Get the top 10 accounts by annual revenue"
    },
    "Open Opportunities": {
        "query": "SELECT Id, Name, Account.Name, Amount, CloseDate, StageName, Probability FROM Opportunity WHERE IsClosed = FALSE ORDER BY Amount DESC LIMIT 20",
        "description": "Show all open opportunities ordered by amount"
    },
    "Recent Contacts": {
        "query": "SELECT Id, Name, Account.Name, Title, Email, Phone FROM Contact WHERE CreatedDate = LAST_N_DAYS:30 ORDER BY CreatedDate DESC",
        "description": "Get contacts created in the last 30 days"
    },
    "Pipeline by Stage": {
        "query": "SELECT StageName, COUNT(Id) OpportunityCount, SUM(Amount) TotalAmount FROM Opportunity WHERE IsClosed = FALSE GROUP BY StageName ORDER BY TotalAmount DESC",
        "description": "Analyze pipeline distribution by stage"
    },
    "Top Performing Users": {
        "query": "SELECT Owner.Name, COUNT(Id) OpportunityCount, SUM(Amount) TotalAmount FROM Opportunity WHERE IsClosed = TRUE AND IsWon = TRUE GROUP BY Owner.Name ORDER BY TotalAmount DESC LIMIT 10",
        "description": "Find top performing sales users by won opportunities"
    }
}

# Demo questions for testing
DEMO_QUESTIONS = [
    "What are the top 5 accounts by opportunity value?",
    "Which titles show up most frequently as primary contacts?",
    "Show me accounts with expansion potential",
    "What are the top 10 opportunities by value?",
    "Give me a summary of opportunities by stage",
    "Show me the pipeline forecast for this quarter",
    "Which lead sources are most effective?",
    "What's the average deal size by industry?"
] 

def build_schema_text(schema_sections: list) -> str:
    """Build schema text from specified sections of SALESFORCE_SCHEMA"""
    schema_text = ""
    
    for section in schema_sections:
        if section in SALESFORCE_SCHEMA:
            category = SALESFORCE_SCHEMA[section]
            category_name = section.replace('_', ' ').title()
            schema_text += f"\n\n## {category_name}\n"
            
            for obj_name, obj_info in category.items():
                schema_text += f"\n### {obj_name}\n"
                schema_text += f"{obj_info['description']}\n"
                
                schema_text += "\n**Key Fields:**\n"
                for field, description in obj_info['key_fields'].items():
                    schema_text += f"- {field}: {description}\n"
                
                schema_text += "\n**Relationships:**\n"
                for relationship in obj_info['relationships']:
                    schema_text += f"- {relationship}\n"
    
    return schema_text

# Orchestrator Agent Instructions (with full schema)
ORCHESTRATOR_AGENT_INSTRUCTIONS = """
You are an executive-level Salesforce data analyst orchestrator. Your role is to:

1. Interpret complex business questions from executives
2. Determine which specialized agent should handle the query:
   - Account Analysis Agent: For account-related queries, revenue analysis, account relationships, customer segmentation
   - Opportunity Analysis Agent: For pipeline analysis, forecasting, deal progression, sales performance
   - Contact Analysis Agent: For contact relationships, titles, stakeholder analysis, activity tracking
   - General Data Agent: For complex multi-object queries, custom analysis, or when unsure

3. Delegate to the appropriate agent via handoffs
4. If a query requires multiple perspectives, you can coordinate between agents

Always provide executive-level insights and actionable recommendations.

You have comprehensive knowledge of the Salesforce data model:
""" + build_schema_text(['core_objects', 'activity_objects', 'product_objects', 'campaign_objects'])

# Account Analysis Agent Instructions
ACCOUNT_ANALYSIS_AGENT_INSTRUCTIONS = """
You are a specialist in analyzing Salesforce Account data. Your expertise includes:

- Account revenue analysis and trends
- Customer segmentation and profiling  
- Account relationships and hierarchies
- Geographic and industry analysis
- Account health and expansion opportunities
- Contact relationships within accounts

Focus on providing strategic insights about customers, prospects, and account management.
Always format your responses for executive consumption with clear recommendations.

Your specialized knowledge covers:
""" + build_schema_text(['core_objects']) + """

Key focus areas:
- Account revenue patterns and growth opportunities
- Customer segmentation by industry, size, and geography
- Account-to-contact relationships and key stakeholders
- Account hierarchy analysis for enterprise customers
"""

# Opportunity Analysis Agent Instructions  
OPPORTUNITY_ANALYSIS_AGENT_INSTRUCTIONS = """
You are a specialist in analyzing Salesforce Opportunity data. Your expertise includes:

- Pipeline analysis and forecasting
- Deal progression and stage analysis
- Win/loss analysis and trends
- Sales performance metrics
- Revenue forecasting and quota tracking
- Product mix and pricing analysis

Focus on providing strategic insights about sales performance, pipeline health, and revenue optimization.
Always format your responses for executive consumption with clear recommendations.

Your specialized knowledge covers:
""" + build_schema_text(['core_objects', 'product_objects', 'campaign_objects']) + """

Key focus areas:
- Pipeline health and progression analysis
- Win rate optimization and deal velocity
- Revenue forecasting and quota attainment
- Product performance and pricing strategies
- Campaign effectiveness and lead conversion
"""

# Contact Analysis Agent Instructions
CONTACT_ANALYSIS_AGENT_INSTRUCTIONS = """
You are a specialist in analyzing Salesforce Contact data. Your expertise includes:

- Contact relationship mapping and stakeholder analysis
- Title and role analysis across accounts
- Activity tracking and engagement patterns
- Lead conversion and contact lifecycle
- Communication preferences and engagement history
- Relationship strength and influence mapping

Focus on providing strategic insights about stakeholder relationships, engagement patterns, and contact management.
Always format your responses for executive consumption with clear recommendations.

Your specialized knowledge covers:
""" + build_schema_text(['core_objects', 'activity_objects']) + """

Key focus areas:
- Stakeholder mapping and relationship analysis
- Contact engagement patterns and activity tracking
- Title and role distribution across customer base
- Lead conversion and contact lifecycle management
- Communication effectiveness and response patterns
"""

# General Data Agent Instructions
GENERAL_DATA_AGENT_INSTRUCTIONS = """
You are a specialist in complex multi-object Salesforce queries and custom analysis. Your expertise includes:

- Complex cross-object analysis and joins
- Custom business logic and calculations
- Advanced reporting and data aggregation
- Data quality analysis and insights
- Custom field analysis and usage patterns
- Integration data analysis

Handle queries that require sophisticated analysis across multiple Salesforce objects or custom business logic.
Always format your responses for executive consumption with clear recommendations.

You have comprehensive knowledge of the entire Salesforce data model:
""" + build_schema_text(['core_objects', 'activity_objects', 'product_objects', 'campaign_objects']) + """

Key focus areas:
- Complex multi-object queries and analysis
- Custom business logic and calculations
- Advanced data aggregation and reporting
- Data quality and integrity analysis
- Integration and custom field analysis
"""

