# CadenceReset Manual QA Checklist

## Home
- [ ] State buttons navigate to recommendations
- [ ] Browse all practices opens full library
- [ ] Recent resets render without crash
- [ ] Empty recent state shows "No resets yet."

## Recommendation flow
- [ ] State check-in passes userState to PracticeLibrary
- [ ] Recommended practices show reasons
- [ ] Practice detail opens correctly from recommendation cards
- [ ] Recommendation reason text is non-empty for recommended practices

## Before check-in
- [ ] Scores can be changed (0–10)
- [ ] Start saves before scores
- [ ] Skip does not save before scores

## Breath practice
- [ ] Breath mode has no Next button
- [ ] Pause/resume preserves countdown
- [ ] Completion opens feedback
- [ ] Exit abandons session
- [ ] Step-based progress bar is hidden in breath mode
- [ ] "Breathing" label shows instead of step indicator

## Step practice
- [ ] Timer advances steps
- [ ] Pause/resume works
- [ ] Manual Next works
- [ ] Completion opens feedback

## Feedback
- [ ] Submit saves after scores
- [ ] reliefDelta is calculated
- [ ] Skip feedback marks feedbackSkipped
- [ ] Submit navigates to result screen
- [ ] Skip navigates to result screen

## Result screen
- [ ] Shows before/after when available
- [ ] Shows score changes with correct direction
- [ ] Handles feedback skipped ("No feedback saved.")
- [ ] Done returns Home
- [ ] Try another reset navigates to recommendations for same state
- [ ] Try another reset navigates to library when no state

## Persistence
- [ ] Completed sessions survive app restart
- [ ] Abandoned sessions appear in history
- [ ] Favorites persist across app restart

## Favorites
- [ ] Store supports favoritePracticeIds
- [ ] Favorite UI is not implemented yet
- [ ] TODO: add favorite button on PracticeDetail or Result screen

## Safety / Copy
- [ ] No medical/therapy claims in UI copy
- [ ] No "you are safe", "healed", "scientifically proven"
- [ ] Tone is calm, practical, minimal
