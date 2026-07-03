import { redirect } from 'next/navigation';

// Old lab detail pages are superseded by Rooms.
export default function LabDetailRedirect() {
  redirect('/rooms');
}