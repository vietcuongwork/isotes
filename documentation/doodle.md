minor: 
- remove AvatarStack
- description field from create trip screen isnt doing anything 
- resolve newly added person, split equally, it seems like only the amount variant is doing that automatically (solved)
- submit-time validation for equally/shares splits should tolerate sum(splits) being off from expenses.amount by a small margin (up to participantCount minor units), not require an exact match — see design_decisions.md "Equal/shares split rounds down per person" (2026-09-22). No submit flow exists yet, but whoever wires insertExpenseWithSplits should not add a strict equality check there.

critical: 
- prevent user navigate back to create trip screen from trip screen 
- amount field currently dont allow to input , from keyboard
- do not allow to unselect the last member of the split in equally variant
- avatarStack tripItem is still hard code

bug: 
- equally variant is always 1 selected even tho the ui shows none (cant reproduce) -> the acutual root cause: the form still persist state from store even when open a new expense sheet after creating a new trip -> solution -> reset the store when expenses screen unmount (might need further testing when we introducing hamburger menu navigation or navigation between trip header because then it will just change the render content of the expense page and not unmount the screen) 