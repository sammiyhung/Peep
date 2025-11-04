# Remaining Updates Needed

## Files That Need `_id` → `_id` Conversion

The following files still reference Appwrite's `_id` field and need to be updated to use MongoDB's `_id`:

### Component Files
1. **`src/components/shared/PostCard.tsx`** - Line 21: `post.creator._id`
2. **`src/components/shared/PostStats.tsx`** - Lines 20, 32, 53, 63, 66: Multiple `_id` references
3. **`src/components/shared/UserCard.tsx`** - Lines 16, 33: `user._id`

### Page Files
4. **`src/_root/pages/AllUsers.tsx`** - Line 51: `creator?._id`
5. **`src/_root/pages/PostDetails.tsx`** - Lines 22, 27, 65, 93, 94, 107: Multiple `_id` references
6. **`src/_root/pages/Profile.tsx`** - Lines 83, 85, 87, 105, 114, 150: Multiple `currentUser._id` references
7. **`src/_root/pages/UpdateProfile.tsx`** - Line 53: `currentUser._id`

### Other Files
8. **`src/constants/index.ts`** - Lines 19, 47: Template strings with `${user._id}`
9. **`src/lib/api/api.ts`** - Line 118: Return object with `_id` (can be updated to `_id` or removed)

## Quick Find & Replace

You can use a global find and replace in your IDE:

**Find:** `\_id`  
**Replace:** `_id`  
**Files:** `src/**/*.tsx`, `src/**/*.ts` (exclude `src/lib/appwrite/**`)

## Manual Review Needed

After the find & replace, manually review:
- Template strings in routes (e.g., `/profile/${user._id}`)
- Object property access (e.g., `user._id`, `post._id`)
- Ensure no breaking changes in component props

## Optional: Delete Old Appwrite Files

Once everything is working, you can safely delete:
- `src/lib/appwrite/` directory (contains old Appwrite config and API)

## Testing Checklist

After updates, test:
- [ ] User profile pages load correctly
- [ ] Post details page works
- [ ] Like/save post functionality
- [ ] Chat with users
- [ ] User cards and navigation
- [ ] Create/edit posts
- [ ] Update profile
