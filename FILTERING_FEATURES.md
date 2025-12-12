# Conversation Filtering Features

## Overview
The Conversations App now includes comprehensive filtering, searching, and sorting capabilities for Conversations, Messages, and Participants.

## Conversations Filters

### Search
Search across multiple fields by typing in the search input:
- **Friendly Name**: Searches the conversation's display name
- **Unique Name**: Searches the conversation's unique identifier
- **Attributes**: Searches within JSON attributes (full text search)
- **Participants**: Searches participant identity and messaging binding addresses

### State Filter
Filter conversations by their state:
- **All States** (default): Shows all conversations
- **Active**: Only active conversations
- **Inactive**: Only inactive conversations
- **Closed**: Only closed conversations

### Date Range Filter
Filter conversations by creation date:
- **From Date**: Show conversations created on or after this date
- **To Date**: Show conversations created on or before this date (inclusive of entire day)

### Sort Options
Sort conversations by:
- **Date** (default): Sort by creation date
- **Name**: Sort by friendly name, unique name, or SID
- **State**: Sort by conversation state
- **Participants**: Sort by number of participants

### Sort Order
Toggle between:
- **Ascending** (↑): A-Z, oldest-newest, lowest-highest
- **Descending** (↓): Z-A, newest-oldest, highest-lowest

### Clear Filters
The "Clear All Filters" button appears when any filter is active and resets:
- Search text
- State filter to "All States"
- Date range (both from and to)

## Messages Filters

### Search
Search messages by:
- **Body**: Message content
- **Author**: Message sender identity

Shows "X of Y messages" count when filtering is active.

## Participants Filters

### Search
Search participants by:
- **Identity**: Participant identity string
- **Address**: Messaging binding address (e.g., phone number, WhatsApp address)

Shows "X of Y participants" count when filtering is active.

## Technical Implementation

### Filter Persistence
All filter preferences are automatically saved to localStorage:
- **Conversation filters**: Search text, state filter, date range, sort by, sort order
- **Message filters**: Search text
- **Participant filters**: Search text

Filters persist across:
- Page refreshes
- Navigation between views
- Browser sessions (until localStorage is cleared)

This means you can set up your preferred filters once and they'll remain active throughout your session.

### Participant Data Caching
To enable participant-based search in conversations:
- Participant data is fetched when loading conversations
- Data is cached in localStorage for 5 minutes
- Each conversation object includes a `participants` array with full participant details
- This allows instant filtering without additional API calls

### Filter Logic
Filters are applied in order:
1. State filter (if not "all")
2. Date range filter (from date, then to date)
3. Text search (searches all configured fields)

All filters work together - a conversation must pass ALL active filters to be displayed.

### Performance Considerations
- Participant data adds to initial load time when viewing conversations
- Cached data reduces subsequent loads
- Filtering is performed client-side for instant results
- Large services with many conversations may experience slower initial loads

## Usage Tips

1. **Combine filters**: Use multiple filters together for precise results (e.g., "active conversations from last week with participant 'john'")
2. **Date ranges**: Use date filters to focus on recent or historical conversations
3. **Participant search**: Search for specific participants across all conversations in a service
4. **Clear filters**: Use "Clear All Filters" to quickly reset and view all conversations

## Future Enhancements

Potential improvements:
- Server-side filtering for better performance with large datasets
- Advanced participant filters (e.g., conversations with specific participant count)
- Saved filter presets
- Export filtered results
