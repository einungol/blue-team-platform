import { redirect } from 'next/navigation';

// The old "labs" (single-flag, no content) were replaced by the interactive
// Rooms system. Keep this route as a permanent redirect so old links work.
export default function LabsRedirect() {
  redirect('/rooms');
}