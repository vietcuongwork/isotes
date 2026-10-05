minor: 
- remove AvatarStack
- description field from create trip screen isnt doing anything 
- resolve newly added person, split equally, it seems like only the amount variant is doing that automatically (solved)
- submit-time validation for equally/shares splits should tolerate sum(splits) being off from expenses.amount by a small margin (up to participantCount minor units), not require an exact match — see design_decisions.md "Equal/shares split rounds down per person" (2026-09-22). No submit flow exists yet, but whoever wires insertExpenseWithSplits should not add a strict equality check there.
- people summary row, just show number of ppl 
- add a cap on share for share split variant 
- next button on description field of newTrip form doesnt open currency picker
- can we up make the animation of closing and open bottom sheet faster to match with that of the os keyboard

critical: 
- prevent user navigate back to create trip screen from trip screen 
- amount field currently dont allow to input , from keyboard
- do not allow to unselect the last member of the split in equally variant
- avatarStack tripItem is still hard code
- pressing outside doesnt dissmiss the keyboard in flatlist splitbottomsheet
- currently we are allowing ppl to input . for our amount but the keyboard only has , so it currently not working
- you lent isnt currently take into account the rounding too so u not gonna get that exact amount 
- dont enable drag to dismiss for bottomsheet keyboard 


bug: 

consider refactor: 

enhancement: 
- centralize modal and bottomsheet service like lift-fe-mobile 


note: 
- session start up protocol 
- add skill detailed preview to show code without making direct edits  

keyboard note: 
- onStartShouldSetResponderCapture always return false and touchStartedInTopSheetRef is always assigend as false too what is the point then, touch starts ─► root startCapture: save start point, flag = false, return false (observe only) if this is observe only why it not just a void function 
- markTouchInTopSheet the second function as i understand is basiclly when a touch is recored in sheet we decide if that sheet is the top sheet right it is pretty self documenting 
- i think the main reason i find it hard to grasp the function funtionality is what is it purpose in the picture like the usecase of it, is it just to decide whether, there are variable that i dont know usecase too like isTapIgnored maybe the problem is that im yet to grasp the cases of interaction between sheet 
- moreover, this func is called onTapOutside topSheet but i dont see the comparsion to understand whether this touch is inside or outside the topsheet 