-- Recreate the trigger to auto-add admin membership on group creation
CREATE TRIGGER on_group_created
AFTER INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION handle_new_group();