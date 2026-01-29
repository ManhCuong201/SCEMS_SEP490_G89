import React, { useState, useEffect } from 'react'

interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string) => void
  debounceMs?: number
}

export const SearchBar: React.FC<SearchBarProps> = ({ placeholder = 'Search...', onSearch, debounceMs = 300 }) => {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs, onSearch])

  return (
    <input
      type="text"
      className="form-input"
      placeholder={placeholder}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      style={{ maxWidth: '300px' }}
    />
  )
}
