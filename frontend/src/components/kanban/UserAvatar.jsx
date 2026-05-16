export default function UserAvatar({ user, size = 28 }) {
  if (!user) {
    return (
      <span className="user-avatar unassigned" style={{ width: size, height: size }} title="Unassigned">
        ?
      </span>
    );
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <span
      className="user-avatar"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      title={user.name}
    >
      {initials}
    </span>
  );
}
