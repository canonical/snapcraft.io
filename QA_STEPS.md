# QA Steps: Fix nested `<p>` tag hydration error in new snap notification

## Overview
This fix addresses a React hydration error that occurred when displaying the "You've uploaded [snap name]!" notification. The error was: "In HTML, `<p>` cannot be a descendant of `<p>`".

## How to verify locally WITHOUT publishing a new snap

### Method 1: Using Browser DevTools to Mock Data (Recommended)

1. **Start the application:**
   ```bash
   dotrun
   ```
   The app will be available at http://localhost:8004

2. **Login to your publisher account:**
   - Navigate to http://localhost:8004
   - Login with your Ubuntu One account
   - Go to "My published snaps" page (usually at http://localhost:8004/snaps)

3. **Open Browser DevTools:**
   - Press F12 or Right-click → Inspect
   - Go to the "Console" tab

4. **Mock the notification by modifying the React component state:**
   
   **Option A - If you have only 1 snap:**
   ```javascript
   // Find the React root
   const root = document.getElementById('root');
   const reactRoot = root._reactRootContainer || root._reactRoot;
   
   // Trigger a re-render with mocked data by modifying localStorage
   // This simulates the is_new flag being set
   localStorage.setItem('mock_new_snap', 'true');
   
   // Refresh the page to see the notification
   location.reload();
   ```

   **Option B - Intercept the API response:**
   ```javascript
   // Before the page loads, intercept fetch requests
   const originalFetch = window.fetch;
   window.fetch = function(...args) {
     return originalFetch.apply(this, args).then(response => {
       if (response.url.includes('/api/account')) {
         return response.clone().json().then(data => {
           // Modify the snap data to include is_new flag
           if (data.snaps && Object.keys(data.snaps).length > 0) {
             const snapKeys = Object.keys(data.snaps);
             if (snapKeys.length === 1) {
               const snapName = snapKeys[0];
               data.snaps[snapName].is_new = true;
             }
           }
           return new Response(JSON.stringify(data), {
             status: response.status,
             statusText: response.statusText,
             headers: response.headers
           });
         });
       }
       return response;
     });
   };
   ```

### Method 2: Using React DevTools Extension

1. **Install React DevTools:**
   - [Chrome/Edge Extension](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
   - [Firefox Add-on](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

2. **Start the application and navigate to the snaps page** (as described in Method 1)

3. **Open React DevTools:**
   - Press F12 → Go to "Components" tab
   - Find the `PublishedSnapList` component in the tree
   - Look for the `snaps` prop

4. **Modify the component props:**
   - Click on the `PublishedSnapList` component
   - In the right panel, find the `snaps` array
   - Edit the first snap object to add `is_new: true`
   - The notification should appear immediately

### Method 3: Modify Backend Logic Temporarily (For thorough testing)

1. **Edit the logic file:**
   ```bash
   vim webapp/publisher/snaps/logic.py
   ```

2. **Temporarily modify the condition** (around line 45-49):
   ```python
   # Original:
   if abs((revision_since - now).days) < 30 and (
       not revisions[0]["channels"]
       or revisions[0]["channels"][0] == "edge"
   ):
       snap_info["is_new"] = True
   
   # Change to always set is_new:
   snap_info["is_new"] = True  # Force for QA testing
   ```

3. **Restart the application:**
   ```bash
   # Stop dotrun (Ctrl+C) and restart
   dotrun
   ```

4. **Navigate to the snaps page** - you should see the notification if you have only 1 snap

5. **IMPORTANT: Revert this change after testing!**

## What to verify

### Before the fix:
- Open browser Console (F12)
- You should see an error: `Warning: In HTML, <p> cannot be a descendant of <p>. This will cause a hydration error.`
- The notification displays correctly but produces a console error

### After the fix:
1. **No console errors:**
   - Open browser Console (F12)
   - Navigate to the snaps page with the mocked notification
   - Verify there are NO hydration errors about nested `<p>` tags

2. **Visual appearance unchanged:**
   - The notification should look exactly the same
   - Text: "You've uploaded [snap-name]!" (if not released) or "You've released [snap-name] to the "edge" channel!" (if released to edge)
   - Links should be properly styled with spacing
   - Links should be clickable and functional

3. **HTML structure is correct:**
   - Right-click on the notification → Inspect
   - Verify the DOM structure:
     ```html
     <div class="p-notification p-notification--information">
       <div class="p-notification__content">
         <h5 class="p-notification__title">You've uploaded [snap-name]!</h5>
         <p class="p-notification__message">
           Want to improve the listing in stores?
           <a href="/[snap-name]/listing">Edit store listing</a>
           <br>
           Is your snap ready to release?
           <a href="/docs/releasing-your-app">Release it</a>
         </p>
       </div>
     </div>
     ```
   - Confirm there are NO nested `<p>` tags inside `p.p-notification__message`

4. **Run the test suite:**
   ```bash
   yarn run test-js -- PublishedSnapList
   ```
   All tests should pass.

## Alternative: Check the deployed demo

The demo environment is automatically deployed for this PR:
- Check the PR comments for the demo URL (posted by @webteam-app bot)
- Login with a staging account that has only 1 snap uploaded in the last 30 days
- Verify the notification appears without console errors

## Test scenarios

### Scenario 1: Newly uploaded snap (not released)
- Mock: `is_new: true`, `latest_release: null`
- Expected: "You've uploaded [snap-name]!"
- Should show both links: "Edit store listing" and "Release it"

### Scenario 2: Newly released snap (to edge channel)
- Mock: `is_new: true`, `latest_release: { channels: ["edge"], ... }`
- Expected: "You've released [snap-name] to the \"edge\" channel!"
- Should show only "Edit store listing" link

### Scenario 3: No notification
- Mock: `is_new: false` or multiple snaps
- Expected: No notification displayed
