import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

// --- DATA & CONFIG ---
const CATEGORIES = {
    'work': { name: 'Work', color: '#5DADE2' },
    'personal': { name: 'Personal', color: '#F7DC6F' },
    'shopping': { name: 'Shopping', color: '#76D7C4' },
    'health': { name: 'Health', color: '#EC7063' },
    'event': { name: 'Event', color: '#AF7AC5' },
};
const getTodayString = () => new Date().toISOString().split('T')[0];

// --- HELPERS ---
const triggerHapticFeedback = (pattern: number | number[] = 30) => {
    if ('vibrate' in navigator && window.navigator.vibrate) {
        try {
            window.navigator.vibrate(pattern);
        } catch (e) {
            console.warn("Haptic feedback failed.", e);
        }
    }
};

// --- STYLES (CSS-in-JS) ---
const styles: { [key: string]: React.CSSProperties } = {
    appHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 20px',
        backgroundColor: 'var(--primary-color)',
        borderBottom: '1px solid var(--border-color)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
    },
    headerTitle: {
        fontSize: '1.7rem',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: 'var(--accent-color)'
    },
    headerIcons: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
    },
    headerIconButton: {
        background: 'transparent',
        border: 'none',
        borderRadius: '50%',
        width: '44px',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--text-muted-color)',
        transition: 'all 0.2s ease',
        fontSize: '26px',
    },
    mainContent: {
        flex: 1,
        overflowY: 'auto',
        backgroundColor: 'var(--bg-color)',
        transition: 'background-color 0.3s ease',
    },
    taskList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
    },
    taskItemContainer: {
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '10px',
        borderRadius: '12px',
    },
    taskItem: {
        backgroundColor: 'var(--primary-color)',
        padding: '15px 20px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'transform 0.3s ease, background-color 0.3s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        cursor: 'grab',
        position: 'relative',
        zIndex: 2,
        userSelect: 'none',
        border: '1px solid var(--border-color)',
        touchAction: 'pan-y',
    },
    taskItemCompleted: {
        opacity: 0.6,
        textDecoration: 'line-through',
    },
    taskContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        flex: 1,
    },
    taskCheckbox: {
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        border: '2px solid var(--text-muted-color)',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'all 0.3s ease',
        flexShrink: 0,
    },
    taskCheckboxChecked: {
        borderColor: 'var(--accent-color)',
        backgroundColor: 'var(--accent-color)',
    },
    taskTextContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    taskText: {
        fontSize: '1rem',
    },
    taskMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '0.8rem',
        color: 'var(--text-muted-color)',
        flexWrap: 'wrap',
    },
    taskCategory: {
        padding: '2px 8px',
        borderRadius: '6px',
        fontSize: '0.75rem',
        color: '#fff',
    },
    taskActions: {
        position: 'absolute',
        top: 0,
        right: 0,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        zIndex: 1,
    },
    deleteButton: {
        backgroundColor: 'var(--danger-color)',
        color: 'white',
        border: 'none',
        width: '80px',
        height: '100%',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '1.5rem',
    },
    formInput: {
        background: 'var(--secondary-color)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '12px 15px',
        color: 'var(--text-color)',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color 0.3s ease, background-color 0.3s ease',
        width: '100%'
    },
    addButton: {
        background: 'var(--accent-color)',
        border: 'none',
        borderRadius: '10px',
        color: 'white',
        padding: '12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.3s ease, transform 0.2s ease',
        width: '100%',
        fontSize: '1rem',
        fontWeight: '500'
    },
    calendarContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '10px 0',
    },
    calendarHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 10px',
    },
    calendarHeaderTitle: {
        fontSize: '1.4rem',
        fontWeight: 600,
    },
    calendarNavButton: {
        background: 'none',
        border: 'none',
        color: 'var(--text-color)',
        cursor: 'pointer',
        padding: '10px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '10px 5px'
    },
    calendarDayHeader: {
        textAlign: 'center',
        fontWeight: '600',
        color: 'var(--text-muted-color)',
        fontSize: '0.8rem',
    },
    calendarCell: {
        borderRadius: '8px',
        aspectRatio: '1 / 1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '4px',
        gap: '4px',
        transition: 'background-color 0.2s ease',
        cursor: 'pointer',
        position: 'relative',
    },
    calendarCellOtherMonth: {
        color: 'var(--text-muted-color)',
        opacity: 0.5,
    },
    calendarDateNum: {
        fontWeight: '500',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        zIndex: 2,
    },
    calendarDateNumToday: {
        boxShadow: '0 0 0 2px var(--accent-color)',
    },
    calendarDateNumWeekend: {
        color: 'var(--danger-color)',
    },
    calendarDateNumSelected: {
        backgroundColor: 'var(--accent-color)',
        color: '#fff',
        fontWeight: 'bold',
    },
    taskDotsContainer: {
        display: 'flex',
        gap: '3px',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: '5px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
    },
    taskDot: {
        width: '5px',
        height: '5px',
        borderRadius: '50%',
    },
    noTasks: {
        textAlign: 'center',
        padding: '50px 20px',
        color: 'var(--text-muted-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
    },
    noTasksIcon: {
        fontSize: '60px',
        marginBottom: '1rem',
        animation: 'empty-icon-float 3s ease-in-out infinite'
    },
    bottomNav: {
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        justifyContent: 'space-around',
        borderTop: '1px solid var(--border-color)',
        padding: '10px 0',
    },
    navButton: {
        background: 'none',
        border: 'none',
        color: 'var(--text-muted-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        cursor: 'pointer',
        transition: 'color 0.3s ease, transform 0.2s ease',
        fontSize: '0.75rem',
        width: '80px',
    },
    activeNavButton: {
        color: 'var(--accent-color)',
    },
    fab: {
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'var(--accent-color)',
        color: 'white',
        border: 'none',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'transform 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease',
        zIndex: 50
    },
    modalBackdrop: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        animation: 'fadeIn 0.3s ease',
    },
    modalContent: {
        backgroundColor: 'var(--primary-color)',
        padding: '25px',
        borderRadius: '15px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.3s ease',
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    modalTitle: {
        fontSize: '1.5rem',
        fontWeight: '600',
    },
    closeButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1.5rem',
        color: 'var(--text-muted-color)'
    },
    toast: {
        position: 'fixed',
        bottom: '90px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#333',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '30px',
        zIndex: 200,
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        fontSize: '0.9rem',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
    },
    homeContainer: { display: 'flex', flexDirection: 'column', gap: '25px' },
    homeHeader: { marginBottom: 0 },
    greeting: { fontSize: '1.8rem', fontWeight: '600' },
    dateSub: { fontSize: '1rem', color: 'var(--text-muted-color)' },
    summaryCards: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '15px',
        padding: '10px 0',
    },
    summaryCard: {
        backgroundColor: 'var(--secondary-color)',
        borderRadius: '15px',
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        alignItems: 'center',
        textAlign: 'center',
        border: '1px solid var(--border-color)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease'
    },
    cardIcon: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '8px',
        color: '#fff',
        fontSize: '18px',
    },
    cardValue: { fontSize: '1.5rem', fontWeight: 'bold' },
    cardLabel: { fontSize: '0.75rem', color: 'var(--text-muted-color)' },
    tasksSection: { marginTop: 0 },
    sectionHeader: { fontSize: '1.2rem', fontWeight: '600', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' },
    filterControls: {
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginBottom: '20px',
    },
    filterButton: {
        background: 'none',
        border: 'none',
        color: 'var(--text-muted-color)',
        padding: '8px 16px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '1rem',
        transition: 'all 0.3s ease',
    },
    activeFilterButton: {
        backgroundColor: 'var(--primary-color)',
        color: 'var(--text-color)',
        boxShadow: '0 2px 8px var(--shadow-color)',
    },
    // Calendar View New Layout
    calendarViewWrapper: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
    },
    calendarGridWrapper: {
        padding: '0 20px 20px 20px',
    },
    agendaContainer: {
        flex: 1,
        overflowY: 'auto',
        borderTop: '1px solid var(--border-color)',
        padding: '15px 20px',
    },
    agendaHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '20px',
    },
    agendaDateNumber: {
        fontSize: '3rem',
        fontWeight: 700,
        color: 'var(--accent-color)',
        lineHeight: 1,
    },
    agendaDateText: {
        display: 'flex',
        flexDirection: 'column',
    },
    agendaDayOfWeek: {
        fontSize: '1.2rem',
        fontWeight: 600,
        textTransform: 'capitalize',
    },
    agendaMonthYear: {
        fontSize: '0.9rem',
        color: 'var(--text-muted-color)',
    },
};

interface Task {
    id: number;
    text: string;
    completed: boolean;
    category: string;
    dueDate: string;
    time?: string;
    location?: string;
}

const Icon = ({ name, style = {}, className = '' }: { name: string, style?: React.CSSProperties, className?: string }) => (
    <span className={`material-icons ${className}`} style={{ fontSize: 'inherit', ...style }}>{name}</span>
);

const Toast = ({ message }: { message: string }) => {
    if (!message) return null;
    return <div style={styles.toast}>{message}</div>;
};

interface TaskItemProps {
    task: Task;
    onToggle: (id: number) => void;
    onDelete: (id: number) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
    const [dragX, setDragX] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const itemRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const pointerStartRef = useRef(0);
    const thresholdCrossed = useRef(false);
    const SWIPE_THRESHOLD = -80;

    const handleDelete = () => {
        if (isDeleting) return;
        setIsDeleting(true);
        setTimeout(() => onDelete(task.id), 300);
    };

    const handleMouseEnter = () => {
        if (!isDragging.current) {
            setIsHovered(true);
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0 || (e.target as HTMLElement).closest('[data-role="checkbox-area"]')) return;

        isDragging.current = true;
        thresholdCrossed.current = false;
        if (itemRef.current) {
            itemRef.current.style.transition = 'none';
            itemRef.current.setPointerCapture(e.pointerId);
        }
        pointerStartRef.current = e.clientX;
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current || !itemRef.current?.hasPointerCapture(e.pointerId)) return;
        
        const change = e.clientX - pointerStartRef.current;
        if (change < 0) {
            if (change < SWIPE_THRESHOLD) {
                 if (!thresholdCrossed.current) {
                    triggerHapticFeedback(50);
                    thresholdCrossed.current = true;
                }
                const overdrag = change - SWIPE_THRESHOLD;
                const resistance = 0.4;
                setDragX(SWIPE_THRESHOLD + overdrag * resistance);
            } else {
                setDragX(change);
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging.current || !itemRef.current?.hasPointerCapture(e.pointerId)) return;
        isDragging.current = false;
        
        if (itemRef.current) {
            itemRef.current.style.transition = 'transform 0.3s ease';
            itemRef.current.releasePointerCapture(e.pointerId);
        }
        
        if (dragX < SWIPE_THRESHOLD) {
            handleDelete();
        } else {
            setDragX(0);
        }
    };
    
    const formatTime12Hour = (timeString: string) => {
        if (!timeString) return '';
        const [hourString, minute] = timeString.split(':');
        const hour = +hourString;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minute.padStart(2, '0')} ${ampm}`;
    };

    const taskItemDynamicStyle: React.CSSProperties = {
        ...styles.taskItem,
        transform: `translateX(${dragX}px)${isHovered ? ' scale(1.02)' : ''}`,
        boxShadow: isHovered ? '0 5px 15px var(--shadow-color)' : undefined,
        borderColor: isHovered ? 'var(--accent-color)' : undefined,
        zIndex: isHovered ? 10 : 2,
    };

    if (isDeleting) {
        taskItemDynamicStyle.transform = 'translateX(-100%)';
        taskItemDynamicStyle.opacity = 0;
        taskItemDynamicStyle.transition = 'transform 0.3s ease, opacity 0.3s ease';
    }

    const deleteIconScale = 1 + 0.3 * Math.min(1, Math.abs(dragX) / Math.abs(SWIPE_THRESHOLD));

    return (
        <div style={styles.taskItemContainer}>
            <div style={styles.taskActions}>
                <div style={styles.deleteButton} onClick={handleDelete}><Icon name="delete_sweep" style={{transform: `scale(${deleteIconScale})`, transition: 'transform 0.1s ease'}} /></div>
            </div>
            <div
                ref={itemRef}
                style={taskItemDynamicStyle}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div style={styles.taskContent}>
                    <div 
                        style={{
                            cursor: 'pointer',
                            padding: '10px',
                            margin: '-10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={() => onToggle(task.id)}
                        role="checkbox"
                        aria-checked={task.completed}
                        data-role="checkbox-area"
                    >
                        <div
                            className={`task-checkbox-visual ${task.completed ? 'checked' : ''}`}
                            style={{ ...styles.taskCheckbox, ...(task.completed ? styles.taskCheckboxChecked : {}) }}
                        >
                            {task.completed && <Icon name="check" className="check-icon-animate" style={{ fontSize: '18px', color: 'white' }} />}
                        </div>
                    </div>
                    <div style={{ ...styles.taskTextContainer, ...(task.completed ? styles.taskItemCompleted : {}) }}>
                        <span style={styles.taskText}>{task.text}</span>
                        <div style={styles.taskMeta}>
                            <Icon name="event" style={{ fontSize: '14px' }} />
                            <span>{new Date(task.dueDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span>
                            {task.time && (
                                <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                                    <Icon name="schedule" style={{ fontSize: '14px' }} />
                                    <span>{formatTime12Hour(task.time)}</span>
                                </div>
                            )}
                            {task.location && (
                                <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                                    <Icon name="location_on" style={{ fontSize: '14px' }} />
                                    <span>{task.location}</span>
                                </div>
                            )}
                            <span style={{
                                ...styles.taskCategory,
                                backgroundColor: CATEGORIES[task.category as keyof typeof CATEGORIES]?.color || '#ccc',
                                marginLeft: 'auto'
                            }}>
                                {CATEGORIES[task.category as keyof typeof CATEGORIES]?.name}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface CalendarViewProps {
    tasks: Task[];
    selectedDate: Date | null;
    onDateSelect: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, selectedDate, onDateSelect }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    const endDate = new Date(monthEnd);
    if (endDate.getDay() !== 6) {
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }

    const days = [];
    let day = new Date(startDate);
    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    
    return (
        <div style={styles.calendarContainer}>
            <div style={styles.calendarHeader}>
                <button style={styles.calendarNavButton} className="calendar-nav-btn" onClick={() => changeMonth(-1)} aria-label="Previous month"><Icon name="chevron_left" /></button>
                <h3 style={styles.calendarHeaderTitle}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button style={styles.calendarNavButton} className="calendar-nav-btn" onClick={() => changeMonth(1)} aria-label="Next month"><Icon name="chevron_right" /></button>
            </div>
            <div style={styles.calendarGrid}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} style={styles.calendarDayHeader}>{d}</div>)}
                {days.map((d, i) => {
                    const tasksForDay = tasks.filter(t => new Date(t.dueDate).toDateString() === d.toDateString());
                    const isSelected = selectedDate ? d.toDateString() === selectedDate.toDateString() : false;
                    const isToday = d.toDateString() === new Date().toDateString();
                    const dayOfWeek = d.getDay();
                    const isWeekend = dayOfWeek === 0;

                    const cellStyle = {
                        ...styles.calendarCell,
                        ...(d.getMonth() !== currentDate.getMonth() ? styles.calendarCellOtherMonth : {}),
                    };

                    const dateNumStyle = {
                        ...styles.calendarDateNum,
                        ...(isWeekend && !isSelected ? styles.calendarDateNumWeekend : {}),
                        ...(isToday && !isSelected ? styles.calendarDateNumToday : {}),
                        ...(isSelected ? styles.calendarDateNumSelected : {}),
                    };
                    
                    const uniqueCategories = [...new Set(tasksForDay.map(t => t.category))];

                    return (
                        <div key={i} style={cellStyle} className="calendar-cell" onClick={() => onDateSelect(d)}>
                            <span style={dateNumStyle}>{d.getDate()}</span>
                            <div style={styles.taskDotsContainer}>
                                {uniqueCategories.slice(0, 4).map(cat => (
                                     <div key={cat} style={{...styles.taskDot, backgroundColor: CATEGORIES[cat as keyof typeof CATEGORIES]?.color || '#ccc' }}></div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const HomeView: React.FC<{
    tasks: Task[],
    setView: (view: 'home' | 'list' | 'calendar') => void,
    onDateSelect: (date: Date) => void,
    onToggle: (id: number) => void,
    onDelete: (id: number) => void
}> = ({ tasks, setView, onDateSelect, onToggle, onDelete }) => {
    
    const todayString = getTodayString();
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const todayTasks = tasks.filter(t => t.dueDate === todayString);
    const overdueTasks = tasks.filter(t => new Date(t.dueDate) < todayDate && !t.completed);
    
    const stats = {
        today: todayTasks.filter(t => !t.completed).length,
        overdue: overdueTasks.length,
        completed: tasks.filter(t => t.completed && t.dueDate === todayString).length,
    };
    
    return (
        <div style={styles.homeContainer}>
            <header style={styles.homeHeader}>
                <h2 style={styles.greeting}>Hello!</h2>
                <p style={styles.dateSub}>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </header>
            
            <div style={styles.summaryCards} className="summary-cards">
                <div style={styles.summaryCard} className="summary-card-interactive">
                    <div style={{...styles.cardIcon, backgroundColor: 'var(--accent-color)'}}><Icon name="today"/></div>
                    <span style={styles.cardValue}>{stats.today}</span>
                    <span style={styles.cardLabel}>Today</span>
                </div>
                <div style={styles.summaryCard} className="summary-card-interactive">
                    <div style={{...styles.cardIcon, backgroundColor: 'var(--danger-color)'}}><Icon name="error_outline"/></div>
                    <span style={styles.cardValue}>{stats.overdue}</span>
                    <span style={styles.cardLabel}>Overdue</span>
                </div>
                <div style={styles.summaryCard} className="summary-card-interactive">
                    <div style={{...styles.cardIcon, backgroundColor: 'var(--success-color)'}}><Icon name="check_circle_outline"/></div>
                    <span style={styles.cardValue}>{stats.completed}</span>
                    <span style={styles.cardLabel}>Completed</span>
                </div>
            </div>

            <section style={styles.tasksSection}>
                <h3 style={styles.sectionHeader}><Icon name="checklist"/> Today's Agenda</h3>
                {todayTasks.length > 0 ? (
                    <ul style={styles.taskList}>
                        {todayTasks.map(task => (
                             <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
                        ))}
                    </ul>
                ) : (
                     <div style={{...styles.noTasks, padding: '20px 0'}}>
                         <Icon name="celebration" style={styles.noTasksIcon} />
                         <h3>All Clear!</h3>
                         <p>No tasks for today. Enjoy your day!</p>
                    </div>
                )}
            </section>
        </div>
    );
}

// --- MAIN APP COMPONENT ---
const App = () => {
    const [tasks, setTasks] = useState<Task[]>(() => {
        const saved = localStorage.getItem('tasks');
        return saved ? JSON.parse(saved) : [];
    });
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskCategory, setNewTaskCategory] = useState('work');
    const [newTaskDate, setNewTaskDate] = useState(getTodayString());
    const [newTaskTime, setNewTaskTime] = useState('');
    const [newTaskLocation, setNewTaskLocation] = useState('');
    const [view, setView] = useState<'home' | 'list' | 'calendar'>('home');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const [toastMessage, setToastMessage] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    useEffect(() => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }, [tasks]);

    useEffect(() => {
        document.body.className = `theme-${theme}`;
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const showToast = (message: string) => {
        setToastMessage(message);
    };

    const handleThemeToggle = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const handleDownloadTasks = () => {
        if (tasks.length === 0) {
            showToast("No tasks to download.");
            return;
        }
        const tasksJson = JSON.stringify(tasks, null, 2);
        const blob = new Blob([tasksJson], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "daink-list-tasks.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Tasks downloaded!");
    };

    const handleBackupTasks = () => {
        if (tasks.length === 0) {
            showToast("No tasks to back up.");
            return;
        }
        const tasksJson = JSON.stringify(tasks);
        navigator.clipboard.writeText(tasksJson).then(() => {
            showToast("Tasks copied to clipboard!");
        }).catch(err => {
            showToast("Failed to copy tasks.");
            console.error('Failed to copy: ', err);
        });
    };

    useEffect(() => {
        if (isModalOpen) {
            if (selectedDate && view === 'calendar') {
                 setNewTaskDate(selectedDate.toISOString().split('T')[0]);
            } else {
                 setNewTaskDate(getTodayString());
            }
            setNewTaskTime('');
            setNewTaskLocation('');
        }
    }, [isModalOpen, selectedDate, view]);

    const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        const newTask: Task = {
            id: Date.now(),
            text: newTaskText.trim(),
            completed: false,
            category: newTaskCategory,
            dueDate: newTaskDate,
            time: newTaskTime || undefined,
            location: (newTaskCategory === 'event' && newTaskLocation.trim()) ? newTaskLocation.trim() : undefined,
        };
        setTasks(prevTasks => [newTask, ...prevTasks]);
        setNewTaskText('');
        setNewTaskTime('');
        setNewTaskLocation('');
        setIsModalOpen(false);
        showToast("Task added successfully!");
    };

    const handleToggleTask = (id: number) => {
        setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
        triggerHapticFeedback();
    };

    const handleDeleteTask = (id: number) => {
        setTasks(tasks.filter(task => task.id !== id));
        showToast("Task deleted.");
        triggerHapticFeedback([100, 30, 100]);
    };
    
    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => {
            const aDate = new Date(`${a.dueDate}T${a.time || '00:00'}`);
            const bDate = new Date(`${b.dueDate}T${b.time || '00:00'}`);
            return aDate.getTime() - bDate.getTime();
        }).sort((a, b) => Number(a.completed) - Number(b.completed));
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        if (filter === 'active') {
            return sortedTasks.filter(task => !task.completed);
        }
        if (filter === 'completed') {
            return sortedTasks.filter(task => task.completed);
        }
        return sortedTasks;
    }, [sortedTasks, filter]);

    const tasksForSelectedDay = useMemo(() => {
        if (!selectedDate) return [];
        return tasks.filter(t => new Date(t.dueDate).toDateString() === selectedDate.toDateString());
    }, [tasks, selectedDate]);

    const { calendarGridWrapper, agendaContainer, ...restStyles } = styles;
    const responsiveCalendarGridWrapper = {
        ...calendarGridWrapper,
        padding: ''
    };
    const responsiveAgendaContainer = {
        ...agendaContainer,
        padding: '',
        borderTop: '1px solid var(--border-color)', // Keep border for mobile
    };
    
    return (
        <>
            <div className="app-container">
                <header style={styles.appHeader}>
                    <h1 style={styles.headerTitle}><Icon name="check_circle" /> Daink List</h1>
                    <div style={styles.headerIcons}>
                        <button style={styles.headerIconButton} className="header-icon-btn" onClick={handleDownloadTasks} aria-label="Download tasks"><Icon name="file_download" /></button>
                        <button style={styles.headerIconButton} className="header-icon-btn" onClick={handleBackupTasks} aria-label="Backup tasks to clipboard"><Icon name="backup" /></button>
                        <button style={styles.headerIconButton} className="header-icon-btn" onClick={handleThemeToggle} aria-label="Toggle theme">
                            <Icon name={theme === 'light' ? 'dark_mode' : 'light_mode'} />
                        </button>
                    </div>
                </header>

                <main style={styles.mainContent} className="main-content">
                    {view === 'home' && (
                        <div className="view-padding">
                            <HomeView tasks={tasks} setView={setView} onDateSelect={setSelectedDate} onToggle={handleToggleTask} onDelete={handleDeleteTask}/>
                        </div>
                    )}
                    {view === 'list' && (
                        <div className="view-padding">
                            <div style={styles.filterControls}>
                                {(['all', 'active', 'completed'] as const).map(f => (
                                    <button
                                        key={f}
                                        style={{...styles.filterButton, ...(filter === f ? styles.activeFilterButton : {})}}
                                        className="filter-button-style"
                                        onClick={() => setFilter(f)}
                                        aria-pressed={filter === f}
                                    >
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </button>
                                ))}
                            </div>
                            {filteredTasks.length > 0 ? (
                                <ul style={styles.taskList} className="task-list-grid">
                                    {filteredTasks.map(task => (
                                        <TaskItem key={task.id} task={task} onToggle={handleToggleTask} onDelete={handleDeleteTask} />
                                    ))}
                                </ul>
                            ) : (
                                <div style={styles.noTasks}>
                                    <Icon name="task_alt" style={styles.noTasksIcon} />
                                    <h3>
                                        {filter === 'all' && 'All clear!'}
                                        {filter === 'active' && 'No active tasks'}
                                        {filter === 'completed' && 'No tasks completed yet'}
                                    </h3>
                                    <p>
                                        {filter === 'all' && 'Add a new task to get started.'}
                                        {filter === 'active' && 'Looks like you\'re all caught up.'}
                                        {filter === 'completed' && 'Complete a task to see it here.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                    {view === 'calendar' && (
                        <div style={styles.calendarViewWrapper} className="calendar-view-responsive">
                            <div style={responsiveCalendarGridWrapper} className="calendar-grid-wrapper-responsive">
                                <CalendarView tasks={tasks} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                            </div>
                            {selectedDate && (
                                <div style={responsiveAgendaContainer} className="agenda-container agenda-container-responsive">
                                    <div style={styles.agendaHeader}>
                                        <div style={styles.agendaDateNumber}>{selectedDate.getDate()}</div>
                                        <div style={styles.agendaDateText}>
                                            <div style={styles.agendaDayOfWeek}>{selectedDate.toLocaleDateString(undefined, { weekday: 'long' })}</div>
                                            <div style={styles.agendaMonthYear}>{selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
                                        </div>
                                    </div>
                                     {tasksForSelectedDay.length > 0 ? (
                                        <ul style={styles.taskList}>
                                            {tasksForSelectedDay.map(task => (
                                                <TaskItem key={task.id} task={task} onToggle={handleToggleTask} onDelete={handleDeleteTask} />
                                            ))}
                                        </ul>
                                    ) : (
                                        <div style={{...styles.noTasks, height: 'auto', padding: '20px'}}>
                                             <Icon name="event_busy" style={{...styles.noTasksIcon, fontSize: '40px'}} />
                                             <h4>No Tasks Scheduled</h4>
                                             <p style={{fontSize: '0.9rem'}}>Enjoy your day or add a new task.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </main>

                <footer style={styles.bottomNav} className="bottom-nav">
                    <button style={{...styles.navButton, ...(view === 'home' ? styles.activeNavButton : {})}} className="nav-btn" onClick={() => setView('home')}>
                        <Icon name="home" style={{fontSize: '24px'}} /> Home
                    </button>
                    <button style={{...styles.navButton, ...(view === 'list' ? styles.activeNavButton : {})}} className="nav-btn" onClick={() => setView('list')}>
                        <Icon name="list_alt" style={{fontSize: '24px'}} /> Tasks
                    </button>
                     <button style={{...styles.navButton, ...(view === 'calendar' ? styles.activeNavButton : {})}} className="nav-btn" onClick={() => setView('calendar')}>
                        <Icon name="calendar_month" style={{fontSize: '24px'}} /> Calendar
                    </button>
                </footer>
            </div>
            
            <button style={styles.fab} className="fab-btn" onClick={() => { setIsModalOpen(true); triggerHapticFeedback(); }} aria-label="Add new task">
                <Icon name="add" style={{fontSize: '30px'}} />
            </button>
            
            <Toast message={toastMessage} />

            {isModalOpen && (
                <div style={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
                    <div style={styles.modalContent} className="modal-content-responsive" onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>Add New Task</h2>
                            <button style={styles.closeButton} className="close-button" onClick={() => setIsModalOpen(false)}><Icon name="close" /></button>
                        </div>
                        <form onSubmit={handleAddTask} className="add-task-form-layout">
                            <input
                                type="text"
                                style={styles.formInput}
                                className="full-width"
                                value={newTaskText}
                                onChange={(e) => setNewTaskText(e.target.value)}
                                placeholder="e.g., Buy groceries"
                                aria-label="New task text"
                                autoFocus
                            />
                            <input
                                type="date"
                                style={styles.formInput}
                                value={newTaskDate}
                                onChange={(e) => setNewTaskDate(e.target.value)}
                                aria-label="Task due date"
                            />
                            <input
                                type="time"
                                style={styles.formInput}
                                value={newTaskTime}
                                onChange={(e) => setNewTaskTime(e.target.value)}
                                aria-label="Task time"
                            />
                            <select
                                style={{...styles.formInput, flexShrink: 0, padding: '12px'}}
                                value={newTaskCategory}
                                onChange={(e) => setNewTaskCategory(e.target.value)}
                                aria-label="Task category"
                                className="full-width-mobile"
                            >
                                {Object.keys(CATEGORIES).map(key => (
                                    <option key={key} value={key}>{CATEGORIES[key as keyof typeof CATEGORIES].name}</option>
                                ))}
                            </select>
                            {newTaskCategory === 'event' && (
                                <input
                                    type="text"
                                    style={styles.formInput}
                                    className="full-width"
                                    value={newTaskLocation}
                                    onChange={(e) => setNewTaskLocation(e.target.value)}
                                    placeholder="Event Location or Address"
                                    aria-label="Event location"
                                />
                            )}
                            <button type="submit" style={styles.addButton} className="full-width add-task-btn" aria-label="Add Task">
                                <Icon name="add_task" style={{marginRight: '8px'}} /> Add Task
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);